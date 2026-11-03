import { API_BASE_URL } from '../../../config/environment';
import { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import {
  MessageCircle, Send, Eye, RefreshCw, CheckCircle2, AlertTriangle, Plug, ChevronRight, Square, Check, CheckCheck, Clock, XCircle,
} from 'lucide-react';
import { AppContext } from '../../../Context/AppContext';
import {
  Button, IconButton, PageHeader, Panel, LoadingState, EmptyState, Sheet, Field, SelectInput, TextInput, ChipGroup, useToast, cx,
} from '../../../Components/ui';

const apiUrl = API_BASE_URL;

const STATUS_GROUPS = [
  { value: 'pending', label: 'لم يحضر بعد' },
  { value: 'waiting', label: 'في الانتظار' },
  { value: 'in_queue', label: 'في الطابور' },
  { value: 'dilatation', label: 'في التمدد' },
  { value: 'in_visit', label: 'عند الطبيب' },
  { value: 'completed', label: 'أنهى الفحص' },
];

const MESSAGE_STATUS = {
  pending: { label: 'في الانتظار', icon: Clock, tone: 'text-muted' },
  sent: { label: 'أُرسلت', icon: Check, tone: 'text-ink-soft' },
  delivered: { label: 'وصلت', icon: CheckCheck, tone: 'text-ink' },
  read: { label: 'قُرئت', icon: CheckCheck, tone: 'text-sky-600' },
  failed: { label: 'فشلت', icon: XCircle, tone: 'text-red-700' },
};

const SETTING_NAMES = {
  token: 'WHATSAPP_TOKEN',
  phone_number_id: 'WHATSAPP_PHONE_NUMBER_ID',
  business_account_id: 'WHATSAPP_BUSINESS_ACCOUNT_ID',
  app_secret: 'WHATSAPP_APP_SECRET',
  verify_token: 'WHATSAPP_VERIFY_TOKEN',
};

/** "12, 15 18-20" → [12, 15, 18, 19, 20] */
function parsePatientIds(text) {
  const ids = new Set();
  for (const part of String(text || '').split(/[\s,،;]+/)) {
    const range = part.match(/^(\d+)-(\d+)$/);
    if (range) {
      const [a, b] = [Number(range[1]), Number(range[2])].sort((x, y) => x - y);
      for (let i = a; i <= b && i - a < 500; i++) ids.add(i);
    } else if (/^\d+$/.test(part)) {
      ids.add(Number(part));
    }
  }
  return [...ids];
}

/** Several choices as chips (wraps on small screens). */
function MultiChips({ label, options, values, onChange }) {
  const toggle = (v) => onChange(values.includes(v) ? values.filter((x) => x !== v) : [...values, v]);
  return (
    <div role="group" aria-label={label} className="flex flex-wrap gap-2">
      {options.map((o) => {
        const active = values.includes(o.value);
        return (
          <button
            key={o.value}
            type="button"
            aria-pressed={active}
            onClick={() => toggle(o.value)}
            className={cx(
              'h-9 px-3 rounded-full text-sm font-semibold border transition-colors',
              active ? 'bg-ink text-white border-ink' : 'bg-white text-ink border-line hover:bg-ink-faint',
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

function Checkbox({ checked, onChange, children, hint }) {
  return (
    <label className="flex items-start gap-3 cursor-pointer">
      <input type="checkbox" className="mt-1 w-4 h-4" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span>
        <span className="text-sm font-semibold text-ink">{children}</span>
        {hint && <span className="block text-xs text-muted">{hint}</span>}
      </span>
    </label>
  );
}

/** The template text with its {{variables}} highlighted. */
function TemplateText({ text }) {
  const parts = String(text || '').split(/(\{\{\s*[A-Za-z0-9_]+\s*\}\})/g);
  return (
    <p className="whitespace-pre-line text-sm text-ink leading-relaxed">
      {parts.map((p, i) => (/^\{\{/.test(p)
        ? <span key={i} className="px-1 rounded bg-amber-100 text-amber-900 font-semibold" dir="ltr">{p}</span>
        : <span key={i}>{p}</span>))}
    </p>
  );
}

function Counts({ counts, total }) {
  const items = [
    ['sent', counts.sent + counts.delivered + counts.read, 'أُرسلت'],
    ['delivered', counts.delivered + counts.read, 'وصلت'],
    ['read', counts.read, 'قُرئت'],
    ['failed', counts.failed, 'فشلت'],
    ['pending', counts.pending, 'متبقية'],
  ];
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
      <span className="text-muted">{total} زائر</span>
      {items.filter(([, n]) => n > 0).map(([key, n, label]) => (
        <span key={key} className={cx('font-semibold', MESSAGE_STATUS[key].tone)}>{n} {label}</span>
      ))}
    </div>
  );
}

/**
 * Super admin: WhatsApp messages to the patients of an event, through the
 * WhatsApp Cloud API with templates approved by Meta. Patients are chosen by
 * specialty, day, status, or one by one; the page sends in batches and shows
 * each message's delivery status.
 */
export default function WhatsAppMessages() {
  const { eventId } = useParams();
  const [searchParams] = useSearchParams();
  const { token } = useContext(AppContext);
  const toast = useToast();

  const [status, setStatus] = useState(null);
  const [event, setEvent] = useState(null);
  const [templates, setTemplates] = useState(null);
  const [campaigns, setCampaigns] = useState([]);

  // The message
  const [templateKey, setTemplateKey] = useState('');
  const [variables, setVariables] = useState({ body: {}, header: {} });
  // The patients
  const [mode, setMode] = useState(searchParams.get('patient') ? 'patients' : 'filters');
  const [specialties, setSpecialties] = useState([]);
  const [days, setDays] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [reminded, setReminded] = useState('all');
  const [patientText, setPatientText] = useState(searchParams.get('patient') || '');
  const [skipAlreadySent, setSkipAlreadySent] = useState(true);
  const [markReminded, setMarkReminded] = useState(false);

  const [preview, setPreview] = useState(null);
  const [previewing, setPreviewing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [sending, setSending] = useState(null); // campaign being sent now
  const stopRef = useRef(false);
  const [openCampaign, setOpenCampaign] = useState(null); // { campaign, messages }

  const api = useCallback(async (path, options = {}) => {
    const res = await fetch(`${apiUrl}/api${path}`, {
      ...options,
      headers: { Accept: 'application/json', 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || 'تعذر الاتصال بالخادم');
    return data;
  }, [token]);

  const loadCampaigns = useCallback(
    () => api(`/events/${eventId}/whatsapp/campaigns`).then((d) => setCampaigns(d.campaigns || [])).catch(() => {}),
    [api, eventId],
  );

  useEffect(() => {
    api('/whatsapp/status').then(setStatus).catch((e) => setStatus({ configured: false, error: e.message, settings: {} }));
    api(`/events/${eventId}`).then((d) => setEvent(d.event || d)).catch(() => toast('تعذر تحميل الحدث', 'error'));
    loadCampaigns();
  }, [api, eventId, loadCampaigns, toast]);

  const loadTemplates = useCallback(() => {
    setTemplates(null);
    api('/whatsapp/templates')
      .then((d) => setTemplates(d.templates || []))
      .catch((e) => { setTemplates([]); toast(e.message, 'error'); });
  }, [api, toast]);

  const connected = !!status?.configured && !status?.error;
  useEffect(() => {
    if (connected) loadTemplates();
  }, [connected, loadTemplates]);

  const usable = useMemo(() => (templates || []).filter((t) => t.status === 'APPROVED' && t.supported), [templates]);
  const waitingApproval = (templates || []).filter((t) => t.status !== 'APPROVED');
  const template = usable.find((t) => `${t.name}|${t.language}` === templateKey);
  const fields = status?.fields || {};

  const chooseTemplate = (key) => {
    setTemplateKey(key);
    const t = usable.find((x) => `${x.name}|${x.language}` === key);
    // Every variable starts on a likely field; the admin changes what is wrong
    const guess = ['full_name', 'appointments', 'event_name', 'arrival_time'];
    const init = (names) => Object.fromEntries((names || []).map((n, i) => [n, { field: guess[i] || 'full_name' }]));
    setVariables({ body: init(t?.body_variables), header: init(t?.header_variables) });
    setPreview(null);
  };

  const specialtyOptions = useMemo(
    () => (event?.event_specialties || []).map((es) => ({ value: es.id, label: es.specialty?.name || `#${es.id}` })),
    [event],
  );
  const dayOptions = useMemo(() => {
    const set = new Set((event?.event_specialties || []).flatMap((es) => (es.days || []).map((d) => (d.day_date || '').slice(0, 10))).filter(Boolean));
    return [...set].sort().map((d) => ({ value: d, label: d }));
  }, [event]);

  const patientIds = useMemo(() => parsePatientIds(patientText), [patientText]);

  const payload = () => ({
    template_name: template?.name,
    template_language: template?.language,
    variables,
    filters: mode === 'patients'
      ? { patient_ids: patientIds }
      : { specialties, days, statuses, reminded, skip_already_sent: skipAlreadySent },
    mark_reminded: markReminded,
  });

  const ready = !!template && (mode !== 'patients' || patientIds.length > 0)
    && ['body', 'header'].every((part) => (template[`${part}_variables`] || []).every((v) => {
      const val = variables[part]?.[v];
      return val && (val.field || (val.text || '').trim());
    }));

  // Any change to the message or the patients needs a new preview before sending
  const change = (setter) => (value) => { setter(value); setPreview(null); };

  const runPreview = async () => {
    setPreviewing(true);
    try {
      setPreview(await api(`/events/${eventId}/whatsapp/preview`, { method: 'POST', body: JSON.stringify(payload()) }));
    } catch (e) {
      toast(e.message, 'error');
    } finally {
      setPreviewing(false);
    }
  };

  /** Sends the campaign's batches until none is left (or Stop). */
  const runCampaign = async (campaign) => {
    stopRef.current = false;
    setSending(campaign);
    try {
      let left = 1;
      while (left > 0 && !stopRef.current) {
        const d = await api(`/whatsapp/campaigns/${campaign.id}/send-next`, { method: 'POST' });
        left = d.left;
        setSending(d.campaign);
      }
      toast(stopRef.current ? 'توقف الإرسال، يمكنك متابعته من السجل' : 'انتهى الإرسال');
    } catch (e) {
      toast(`${e.message}. يمكنك متابعة الإرسال من السجل.`, 'error');
    } finally {
      setSending(null);
      loadCampaigns();
    }
  };

  const createAndSend = async () => {
    setConfirming(false);
    try {
      const d = await api(`/events/${eventId}/whatsapp/campaigns`, { method: 'POST', body: JSON.stringify(payload()) });
      setPreview(null);
      loadCampaigns();
      runCampaign(d.campaign);
    } catch (e) {
      toast(e.message, 'error');
    }
  };

  const openDetails = async (campaign) => {
    try {
      setOpenCampaign(await api(`/whatsapp/campaigns/${campaign.id}`));
    } catch (e) {
      toast(e.message, 'error');
    }
  };

  const retryFailed = async (campaign) => {
    try {
      const d = await api(`/whatsapp/campaigns/${campaign.id}/retry`, { method: 'POST' });
      setOpenCampaign(null);
      if (d.requeued) runCampaign(d.campaign);
      else toast('لا توجد رسائل يمكن إعادة إرسالها');
    } catch (e) {
      toast(e.message, 'error');
    }
  };

  if (!status) return <LoadingState />;

  const progress = sending ? Math.round(((sending.total - sending.counts.pending) / Math.max(1, sending.total)) * 100) : 0;
  const willReceive = preview ? preview.count - preview.without_phone : 0;

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <div>
        <Link to={`/admin/event-tracking/${eventId}`} className="inline-flex items-center gap-1 text-sm text-muted hover:text-ink mb-2">
          <ChevronRight className="w-4 h-4" /> {event?.name || 'الحدث'}
        </Link>
        <PageHeader title="رسائل واتساب" subtitle="رسائل من قوالب معتمدة إلى زوار الحدث" />
      </div>

      {/* Connection */}
      {!connected ? (
        <Panel title="ربط واتساب">
          <p className="flex items-start gap-2 text-sm text-amber-800 bg-amber-50 rounded-xl p-3 mb-3">
            <Plug className="w-4 h-4 mt-0.5 shrink-0" />
            {status.error || 'واتساب غير مربوط بعد. أضف هذه الإعدادات في ملف .env على الخادم ثم أعد تحميل الصفحة.'}
          </p>
          <ul className="space-y-1 text-sm" dir="ltr">
            {Object.entries(SETTING_NAMES).map(([key, name]) => (
              <li key={key} className="flex items-center gap-2">
                {status.settings?.[key] ? <CheckCircle2 className="w-4 h-4 text-emerald-700" /> : <XCircle className="w-4 h-4 text-red-700" />}
                <code>{name}</code>
              </li>
            ))}
          </ul>
          {status.webhook_url && (
            <p className="text-xs text-muted mt-3">رابط Webhook في Meta: <code dir="ltr" className="select-all">{status.webhook_url}</code></p>
          )}
        </Panel>
      ) : (
        <p className="flex flex-wrap items-center gap-2 text-sm text-emerald-800">
          <CheckCircle2 className="w-4 h-4" />
          مربوط: {status.phone?.verified_name} <span dir="ltr">{status.phone?.display_phone_number}</span>
          {status.phone?.quality_rating && <span className="text-muted">· الجودة {status.phone.quality_rating}</span>}
          {!status.settings?.app_secret && <span className="text-amber-800">· حالات الوصول والقراءة لن تظهر قبل إضافة WHATSAPP_APP_SECRET</span>}
        </p>
      )}

      {/* Sending now */}
      {sending && (
        <Panel
          title={`جاري الإرسال: ${sending.template_name}`}
          actions={<Button size="sm" variant="secondary" icon={Square} onClick={() => { stopRef.current = true; }}>أوقف</Button>}
        >
          <div className="h-3 rounded-full bg-ink-faint overflow-hidden mb-2" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
            <div className="h-full bg-emerald-600 transition-all" style={{ width: `${progress}%` }} />
          </div>
          <Counts counts={sending.counts} total={sending.total} />
          <p className="text-xs text-muted mt-2">اترك هذه الصفحة مفتوحة حتى ينتهي الإرسال.</p>
        </Panel>
      )}

      {connected && (
        <Panel title="رسالة جديدة">
          <div className="space-y-5">
            {/* 1. Template */}
            <Field
              label="القالب"
              hint={templates && usable.length === 0
                ? 'لا يوجد قالب معتمد. أنشئ قالباً في WhatsApp Manager وانتظر موافقة واتساب.'
                : `القوالب المعتمدة من واتساب فقط${waitingApproval.length ? ` (${waitingApproval.length} في انتظار الموافقة أو مرفوضة)` : ''}`}
            >
              <div className="flex gap-2">
                <SelectInput value={templateKey} onChange={(e) => chooseTemplate(e.target.value)} disabled={!templates}>
                  <option value="">{templates ? 'اختر القالب' : 'جاري التحميل…'}</option>
                  {usable.map((t) => (
                    <option key={`${t.name}|${t.language}`} value={`${t.name}|${t.language}`}>{t.name} ({t.language})</option>
                  ))}
                </SelectInput>
                <IconButton icon={RefreshCw} label="حدّث القوالب" className="shrink-0 border border-line bg-white" onClick={loadTemplates} />
              </div>
            </Field>

            {template && (
              <>
                <div className="rounded-xl bg-paper p-3">
                  {template.header?.text && <div className="font-semibold mb-1"><TemplateText text={template.header.text} /></div>}
                  <TemplateText text={template.body} />
                </div>

                {/* 2. Variables */}
                {['header', 'body'].map((part) => (template[`${part}_variables`] || []).map((v) => {
                  const val = variables[part]?.[v] || {};
                  const set = (next) => { setVariables((prev) => ({ ...prev, [part]: { ...prev[part], [v]: next } })); setPreview(null); };
                  return (
                    <Field key={`${part}-${v}`} label={<>المتغير <span dir="ltr">{`{{${v}}}`}</span>{part === 'header' ? ' (العنوان)' : ''}</>}>
                      <div className="flex gap-2">
                        <SelectInput
                          value={val.field ? val.field : '__text'}
                          onChange={(e) => set(e.target.value === '__text' ? { text: '' } : { field: e.target.value })}
                        >
                          {Object.entries(fields).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
                          <option value="__text">نص ثابت…</option>
                        </SelectInput>
                        {!val.field && (
                          <TextInput value={val.text || ''} placeholder="النص نفسه لكل الزوار" onChange={(e) => set({ text: e.target.value })} />
                        )}
                      </div>
                    </Field>
                  );
                }))}

                {/* 3. Patients */}
                <div className="space-y-3">
                  <p className="text-sm font-semibold text-ink">المستلمون</p>
                  <ChipGroup
                    label="طريقة الاختيار"
                    value={mode}
                    onChange={change(setMode)}
                    options={[{ value: 'filters', label: 'حسب التخصص واليوم والحالة' }, { value: 'patients', label: 'زوار محددون' }]}
                  />
                  {mode === 'patients' ? (
                    <Field label="أرقام الزوار" hint={`مفصولة بفاصلة أو مسافة، أو مجال مثل 120-135. ${patientIds.length} رقم`}>
                      <TextInput value={patientText} dir="ltr" placeholder="1024, 1031 1040-1045" onChange={(e) => change(setPatientText)(e.target.value)} />
                    </Field>
                  ) : (
                    <>
                      <Field label="التخصصات" hint={specialties.length ? '' : 'بدون اختيار: كل التخصصات'}>
                        <MultiChips label="التخصصات" options={specialtyOptions} values={specialties} onChange={change(setSpecialties)} />
                      </Field>
                      {dayOptions.length > 1 && (
                        <Field label="الأيام" hint={days.length ? '' : 'بدون اختيار: كل الأيام'}>
                          <MultiChips label="الأيام" options={dayOptions} values={days} onChange={change(setDays)} />
                        </Field>
                      )}
                      <Field label="الحالة" hint={statuses.length ? '' : 'بدون اختيار: كل الحالات'}>
                        <MultiChips label="الحالة" options={STATUS_GROUPS} values={statuses} onChange={change(setStatuses)} />
                      </Field>
                      <Field label="التذكير">
                        <ChipGroup
                          label="التذكير"
                          value={reminded}
                          onChange={change(setReminded)}
                          options={[{ value: 'all', label: 'الكل' }, { value: 'no', label: 'لم يُذكَّروا بعد' }, { value: 'yes', label: 'سبق تذكيرهم' }]}
                        />
                      </Field>
                      <Checkbox checked={skipAlreadySent} onChange={change(setSkipAlreadySent)} hint="لا يُرسل هذا القالب مرتين لنفس الزائر في هذا الحدث">
                        تجاهل من وصله هذا القالب من قبل
                      </Checkbox>
                    </>
                  )}
                  <Checkbox checked={markReminded} onChange={setMarkReminded} hint="يظهرون «تم تذكيرهم» في مكتب الحضور بعد الإرسال">
                    اعتبرهم مُذكَّرين
                  </Checkbox>
                </div>

                {/* 4. Preview, then send */}
                <div className="flex flex-wrap gap-2">
                  <Button variant="secondary" icon={Eye} loading={previewing} disabled={!ready || !!sending} onClick={runPreview}>عاين</Button>
                  <Button icon={Send} disabled={!preview || willReceive === 0 || !!sending} onClick={() => setConfirming(true)}>
                    أرسل{preview ? ` (${willReceive})` : ''}
                  </Button>
                </div>

                {preview && (
                  <div className="space-y-3">
                    <p className="text-sm text-ink">
                      <strong>{preview.count}</strong> زائر
                      {preview.without_phone > 0 && <span className="text-red-700"> · {preview.without_phone} بدون رقم صالح (لن تصلهم)</span>}
                    </p>
                    {preview.samples.map((s) => (
                      <div key={s.patient_id} className="rounded-2xl rounded-tr-sm bg-[#dcf8c6] p-3 max-w-md shadow-sm">
                        <p className="text-xs text-muted mb-1">#{s.patient_id} · <span dir="ltr">{s.phone || 'بدون رقم'}</span></p>
                        <p className="whitespace-pre-line text-sm text-ink">{s.text}</p>
                      </div>
                    ))}
                    {preview.count === 0 && <p className="text-sm text-muted">لا يوجد زائر يطابق الاختيار.</p>}
                  </div>
                )}
              </>
            )}
          </div>
        </Panel>
      )}

      {/* History */}
      <Panel title="سجل الإرسال">
        {campaigns.length === 0 ? (
          <EmptyState icon={MessageCircle} title="لم تُرسل رسائل في هذا الحدث بعد" />
        ) : (
          <ul className="divide-y divide-line -mx-4">
            {campaigns.map((c) => (
              <li key={c.id}>
                <button type="button" onClick={() => openDetails(c)} className="w-full text-start px-4 py-3 hover:bg-ink-faint">
                  <p className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-ink">{c.template_name}</span>
                    <span className="text-xs text-muted" dir="ltr">{(c.created_at || '').slice(0, 16).replace('T', ' ')}</span>
                  </p>
                  <Counts counts={c.counts} total={c.total} />
                  {c.user && <p className="text-xs text-muted mt-0.5">بواسطة {c.user}</p>}
                </button>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      {/* Confirm */}
      <Sheet
        open={confirming}
        onClose={() => setConfirming(false)}
        title="تأكيد الإرسال"
        footer={(
          <div className="flex gap-2">
            <Button block icon={Send} onClick={createAndSend}>أرسل الآن</Button>
            <Button variant="secondary" onClick={() => setConfirming(false)}>إلغاء</Button>
          </div>
        )}
      >
        {preview && template && (
          <p className="text-sm text-ink">
            ستُرسل رسالة القالب <strong>{template.name}</strong> إلى <strong>{willReceive}</strong> زائر.
            لا يمكن استرجاع رسالة بعد إرسالها، وتُحتسب كل رسالة في فاتورة واتساب للأعمال.
          </p>
        )}
      </Sheet>

      {/* One campaign */}
      <Sheet
        size="lg"
        open={!!openCampaign}
        onClose={() => setOpenCampaign(null)}
        title={openCampaign ? openCampaign.campaign.template_name : ''}
        footer={openCampaign && !sending && (openCampaign.campaign.counts.pending > 0 || openCampaign.campaign.counts.failed > 0) && (
          <div className="flex flex-wrap gap-2">
            {openCampaign.campaign.counts.pending > 0 && (
              <Button icon={Send} onClick={() => { const c = openCampaign.campaign; setOpenCampaign(null); runCampaign(c); }}>
                تابع الإرسال ({openCampaign.campaign.counts.pending})
              </Button>
            )}
            {openCampaign.campaign.counts.failed > 0 && (
              <Button variant="secondary" icon={RefreshCw} onClick={() => retryFailed(openCampaign.campaign)}>أعد إرسال الفاشلة</Button>
            )}
          </div>
        )}
      >
        {openCampaign && (
          <div className="space-y-3">
            <Counts counts={openCampaign.campaign.counts} total={openCampaign.campaign.total} />
            {openCampaign.campaign.template_body && (
              <div className="rounded-xl bg-paper p-3"><TemplateText text={openCampaign.campaign.template_body} /></div>
            )}
            <ul className="divide-y divide-line">
              {openCampaign.messages.map((m) => {
                const s = MESSAGE_STATUS[m.status] || MESSAGE_STATUS.pending;
                const Icon = s.icon;
                return (
                  <li key={m.id} className="py-2 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-ink truncate">#{m.patient_id} {m.full_name}</p>
                      <p className="text-xs text-muted" dir="ltr">{m.phone}</p>
                      {m.error && (
                        <p className="flex items-start gap-1 text-xs text-red-700 mt-0.5">
                          <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" /> {m.error}
                        </p>
                      )}
                    </div>
                    <span className={cx('shrink-0 inline-flex items-center gap-1 text-xs font-semibold', s.tone)}>
                      <Icon className="w-4 h-4" /> {s.label}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </Sheet>
    </div>
  );
}
