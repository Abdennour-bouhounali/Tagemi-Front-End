import { useState } from "react";
import { ShieldCheck, Database, Users, Clock, Scale, Search, Printer, Mail, Phone } from "lucide-react";
import { apiUrl } from "../../Context/AppContext";
import { Button, Field, TextInput } from "../../Components/ui";
import { writePrintDocument, escapeHtml } from "../../utils/safeHtml";
import { DATA_ITEMS, PRIVACY_LAW, CONTACT } from "../../utils/privacyData";

const RIGHTS = [
  { title: "حق الإعلام", text: "أن تعرف ما نجمعه عنك ولماذا، وهو ما تقرؤه في هذه الصفحة." },
  { title: "حق الولوج", text: "أن تطّلع على كل بياناتك المحفوظة لدينا متى شئت، مجاناً، من الخانة أسفل هذه الصفحة." },
  { title: "حق التصحيح", text: "أن تطلب تصحيح أي معلومة خاطئة أو ناقصة." },
  { title: "حق الاعتراض والحذف", text: "أن تطلب حذف بياناتك أو التوقف عن استعمالها، ما لم يكن موعدك قيد التنفيذ." },
  { title: "سحب الموافقة", text: "أن تسحب موافقتك في أي وقت، دون أن يمسّ ذلك ما تمّ قبل السحب." },
];

function Section({ icon: Icon, title, children }) {
  return (
    <section className="bg-white border border-line rounded-2xl p-4 sm:p-5">
      <h2 className="flex items-center gap-2 font-display text-lg text-ink mb-3">
        <Icon className="w-5 h-5 shrink-0" aria-hidden="true" />
        {title}
      </h2>
      <div className="space-y-2 text-base leading-relaxed text-ink">{children}</div>
    </section>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-3 py-2.5">
      <dt className="text-sm text-muted shrink-0">{label}</dt>
      <dd className="text-base text-ink text-end break-words min-w-0">{value || "—"}</dd>
    </div>
  );
}

const printData = (data) => {
  const e = escapeHtml;
  const p = data.person;
  const rows = [
    ["الاسم الكامل", p.full_name], ["تاريخ الميلاد", p.birthday], ["الجنس", p.sex],
    ["الولاية", p.state], ["البلدية", p.city], ["الهاتف", p.phone], ["هاتف ثان", p.phone2],
    ["الأمراض المزمنة", p.diseases],
  ];
  const win = window.open("", "_blank");
  writePrintDocument(win, `
    <!DOCTYPE html><html dir="rtl"><head><meta charset="utf-8"><title>بياناتي</title>
    <style>body{font-family:Arial,sans-serif;padding:24px;color:#101E58}h1{font-size:20px}h2{font-size:16px;margin-top:20px}
    table{width:100%;border-collapse:collapse}td{border:1px solid #ddd;padding:6px;font-size:13px;vertical-align:top}
    td:first-child{width:35%;color:#555}p{font-size:12px;color:#555}</style></head><body>
    <h1>البيانات الشخصية المحفوظة لدى مؤسسة تجمي</h1>
    <p>صدرت في ${e(data.generated_at)} تطبيقاً لحق الولوج (${e(PRIVACY_LAW)}).</p>
    <table>${rows.map(([k, v]) => `<tr><td>${e(k)}</td><td>${e(v || "—")}</td></tr>`).join("")}</table>
    ${data.visits.map((v) => `
      <h2>${e(v.event || "حملة")} · ${e(v.specialty || "")}</h2>
      <table>
        <tr><td>رقم المريض</td><td>${e(v.patient_id)}</td></tr>
        <tr><td>الموعد</td><td>${e(v.date || "—")} ${e(v.time || "")}</td></tr>
        <tr><td>الحالة</td><td>${e(v.status)}</td></tr>
        <tr><td>ملاحظات الفريق الطبي</td><td>${e(v.comment || "—")}</td></tr>
        <tr><td>مستندات مرفقة</td><td>${e(v.documents_count)}</td></tr>
        <tr><td>تاريخ الحجز</td><td>${e(v.booked_at || "—")}</td></tr>
        <tr><td>تاريخ الموافقة على معالجة البيانات</td><td>${e(v.consent_at || "قبل إضافة خطوة الموافقة")}</td></tr>
      </table>`).join("")}
    </body></html>`);
  setTimeout(() => win?.print(), 300);
};

/** Right of access: the patient proves who they are and reads everything we keep. */
function MyDataForm() {
  const [form, setForm] = useState({ patient_id: "", phone: "", birthday: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState(null);

  const set = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  const ready = form.patient_id && form.phone && form.birthday;

  const submit = async (e) => {
    e.preventDefault();
    if (!ready || loading) return;
    setLoading(true);
    setError("");
    setData(null);
    try {
      const res = await fetch(`${apiUrl}/api/public/my-data`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok) setData(json);
      else if (res.status === 429) setError("محاولات كثيرة. انتظر دقيقة ثم أعد المحاولة.");
      else setError(json.message || "تعذر جلب بياناتك. أعد المحاولة.");
    } catch {
      setError("تحقق من الاتصال ثم أعد المحاولة.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="my-data" className="bg-white border-2 border-ink rounded-2xl p-4 sm:p-5 scroll-mt-24">
      <h2 className="flex items-center gap-2 font-display text-lg text-ink mb-1">
        <Search className="w-5 h-5 shrink-0" aria-hidden="true" />
        اطّلع على بياناتك الآن
      </h2>
      <p className="text-sm text-muted mb-4">
        رقم المريض مكتوب على وصل الحجز. نطلب المعلومات الثلاث معاً لنتأكد أن البيانات لك وحدك.
      </p>

      <form onSubmit={submit} className="space-y-4">
        <Field label="رقم المريض">
          <TextInput name="patient_id" inputMode="numeric" dir="ltr" className="text-start text-lg" value={form.patient_id} onChange={set} />
        </Field>
        <Field label="رقم الهاتف الذي حجزت به">
          <TextInput name="phone" type="tel" inputMode="tel" dir="ltr" placeholder="05xx xx xx xx" className="text-start text-lg" value={form.phone} onChange={set} />
        </Field>
        <Field label="تاريخ الميلاد">
          <TextInput name="birthday" type="date" dir="ltr" className="text-start" value={form.birthday} onChange={set} />
        </Field>
        {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
        <Button type="submit" block loading={loading} disabled={!ready}>اعرض بياناتي</Button>
      </form>

      {data && (
        <div className="mt-6 space-y-4">
          <div className="rounded-xl border border-line p-4">
            <h3 className="font-semibold text-ink mb-1">معلوماتك الشخصية</h3>
            <dl className="divide-y divide-line">
              <Row label="الاسم الكامل" value={data.person.full_name} />
              <Row label="تاريخ الميلاد" value={<span dir="ltr">{data.person.birthday}</span>} />
              <Row label="الجنس" value={data.person.sex} />
              <Row label="الولاية" value={data.person.state} />
              <Row label="البلدية" value={data.person.city} />
              <Row label="الهاتف" value={<span dir="ltr">{data.person.phone}</span>} />
              <Row label="هاتف ثان" value={data.person.phone2 && <span dir="ltr">{data.person.phone2}</span>} />
              <Row label="الأمراض المزمنة" value={data.person.diseases} />
            </dl>
          </div>

          {data.visits.map((v) => (
            <div key={`${v.patient_id}-${v.specialty}-${v.date}`} className="rounded-xl border border-line p-4">
              <h3 className="font-semibold text-ink">{v.specialty}</h3>
              <p className="text-sm text-muted mb-1">{v.event}</p>
              <dl className="divide-y divide-line">
                <Row label="رقم المريض" value={v.patient_id} />
                <Row label="الموعد" value={<span dir="ltr">{[v.date, v.time].filter(Boolean).join(" ")}</span>} />
                <Row label="الحالة" value={v.status} />
                <Row label="ملاحظات الفريق الطبي" value={v.comment} />
                <Row label="مستندات مرفقة" value={String(v.documents_count)} />
                <Row label="تاريخ الموافقة" value={v.consent_at ? <span dir="ltr">{v.consent_at}</span> : "قبل إضافة خطوة الموافقة"} />
              </dl>
            </div>
          ))}

          <Button variant="secondary" icon={Printer} block onClick={() => printData(data)}>اطبع أو احفظ نسخة PDF</Button>
          <p className="text-sm text-muted">
            لنسخة من مستنداتك الطبية، أو لتصحيح معلومة أو حذفها، تواصل معنا وأذكر رقم المريض.
          </p>
        </div>
      )}
    </section>
  );
}

export default function Privacy() {
  return (
    <div dir="rtl" className="staff-app min-h-screen">
      <div className="max-w-2xl mx-auto w-full px-4 py-6 lg:py-10 space-y-4">
        <div className="mb-2">
          <h1 className="font-display text-2xl text-ink">الخصوصية وحماية بياناتك</h1>
          <p className="mt-2 text-base text-muted leading-relaxed">
            عند حجز موعد في قوافل مؤسسة تجمي الطبية، نحفظ بعض المعلومات عنك. تشرح هذه الصفحة ما نحفظه، ولماذا، وكيف تطّلع عليه متى شئت.
          </p>
          <a href="#my-data" className="mt-3 inline-flex items-center gap-1.5 text-base font-semibold text-ink underline underline-offset-4">
            <Search className="w-4 h-4" aria-hidden="true" />
            اطّلع على بياناتك مباشرة
          </a>
        </div>

        <Section icon={Scale} title="الإطار القانوني">
          <p>نعالج بياناتك وفق {PRIVACY_LAW}.</p>
          <p>
            المعلومات الصحية (الأمراض المزمنة والمستندات الطبية) معطيات حساسة في نظر هذا القانون، ولا نعالجها إلا بموافقتك الصريحة التي تعطيها قبل تأكيد الحجز.
          </p>
          <p>المسؤول عن المعالجة: مؤسسة تجمي (جمعية تجمي).</p>
        </Section>

        <Section icon={Database} title="ما نحفظه ولماذا">
          <ul className="divide-y divide-line -my-2">
            {DATA_ITEMS.map((item) => (
              <li key={item.label} className="py-3">
                <p className="font-semibold text-ink">{item.label}</p>
                <p className="text-sm text-muted mt-0.5">{item.why}</p>
              </li>
            ))}
          </ul>
          <p className="text-sm text-muted pt-2">
            لا نطلب أي معلومة غير هذه. استبيان التقييم بعد الفحص لا يحمل اسمك.
          </p>
        </Section>

        <Section icon={Users} title="من يطّلع عليها">
          <p>فريق القافلة فقط، كلٌّ حسب دوره: الاستقبال يرى ما يلزم لتسجيل حضورك، والطبيب يرى ما يلزم لفحصك، والمنظمون يرون ما يلزم لتنظيم الطوابير.</p>
          <p>لا نبيع بياناتك، ولا نعطيها لأي جهة خارج المؤسسة، ولا ننقلها خارج الجزائر.</p>
          <p>الإحصائيات التي ننشرها أرقام مجمّعة لا تكشف هوية أي شخص.</p>
        </Section>

        <Section icon={Clock} title="مدة الحفظ">
          <p>بعد انتهاء القافلة تُنقل مواعيدك إلى الأرشيف، لمتابعة حالتك في القوافل القادمة ولإعداد الإحصائيات. يمكنك طلب حذفها في أي وقت.</p>
        </Section>

        <Section icon={ShieldCheck} title="حقوقك">
          <ul className="space-y-3">
            {RIGHTS.map((r) => (
              <li key={r.title}>
                <p className="font-semibold text-ink">{r.title}</p>
                <p className="text-sm text-muted mt-0.5">{r.text}</p>
              </li>
            ))}
          </ul>
          <p className="text-sm text-muted pt-2">
            إن رأيت أن حقوقك لم تُحترم، يمكنك تقديم شكوى إلى السلطة الوطنية لحماية المعطيات ذات الطابع الشخصي.
          </p>
        </Section>

        <MyDataForm />

        <Section icon={Mail} title="تواصل معنا">
          <p>للتصحيح أو الحذف أو سحب الموافقة، أو لأي سؤال عن بياناتك:</p>
          <a href={`mailto:${CONTACT.email}`} className="flex items-center gap-2 min-h-[44px] font-semibold text-ink underline underline-offset-4" dir="ltr">
            <Mail className="w-5 h-5" aria-hidden="true" /> {CONTACT.email}
          </a>
          <a href={`tel:${CONTACT.phone}`} className="flex items-center gap-2 min-h-[44px] font-semibold text-ink underline underline-offset-4" dir="ltr">
            <Phone className="w-5 h-5" aria-hidden="true" /> {CONTACT.phone}
          </a>
        </Section>
      </div>
    </div>
  );
}
