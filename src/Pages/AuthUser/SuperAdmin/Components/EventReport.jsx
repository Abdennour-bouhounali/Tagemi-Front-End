import { API_BASE_URL } from '../../../../config/environment';
// Post-event report of a caravan (super admin). A long form split into
// collapsible sections; read-only once approved. Printed via PrintableReport.
import { useState, useEffect, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ChevronDown, Edit, FileDown, Lock, Plus, Printer, Save, Trash2, Undo2,
} from "lucide-react";
import { AppContext } from "../../../../Context/AppContext";
import { writePrintDocument } from "../../../../utils/safeHtml";
import {
  Button, Field, IconButton, LoadingState, PageHeader, SelectInput, TextInput, cx, inputClass, useToast,
} from "../../../../Components/ui";
import { ActionsMenu, BackLink, ErrorState, POPUP_BLOCKED } from "../../../../Components/ui/StatsKit";
import { ConfirmSheet, FormActionBar } from "./EventFormParts";
import { generatePrintableHTML } from "./PrintableReport";

const apiUrl = API_BASE_URL;

const EMPTY_REPORT = {
  // Executive Summary
  executive_summary: "",
  key_achievements: "",
  critical_issues: "",
  // Event Overview
  total_attendees: "",
  registered_attendees: "",
  actual_attendees: "",
  venue_name: "",
  venue_feedback: "",
  // Performance Metrics
  total_appointments: "",
  completed_appointments: "",
  cancelled_appointments: "",
  no_show_appointments: "",
  // Team Performance
  total_staff: "",
  total_volunteers: "",
  team_performance_notes: "",
  outstanding_team_members: "",
  // Logistics
  logistics_summary: "",
  transportation_notes: "",
  accommodation_notes: "",
  catering_notes: "",
  equipment_notes: "",
  // Financial
  planned_budget: "",
  actual_expenses: "",
  major_expenses: "",
  cost_saving_measures: "",
  // Marketing
  marketing_channels_used: "",
  social_media_reach: "",
  social_media_engagement: "",
  marketing_effectiveness: "",
  // Feedback
  overall_satisfaction_rating: "",
  positive_feedback_summary: "",
  negative_feedback_summary: "",
  attendee_suggestions: "",
  // Media
  media_mentions: "",
  media_outlets: "",
  media_highlights: "",
  // Sponsors
  sponsors_list: "",
  partnership_outcomes: "",
  sponsor_feedback: "",
  // Main Content
  positive_points: "",
  negative_points: "",
  challenges_faced: "",
  solutions_implemented: "",
  // Technical
  technical_issues: "",
  technical_solutions: "",
  infrastructure_notes: "",
  // Security
  security_measures: "",
  safety_incidents: "",
  health_protocols: "",
  // Program
  program_highlights: "",
  speaker_performance: "",
  session_feedback: "",
  // Lessons
  what_went_well: "",
  what_went_wrong: "",
  unexpected_outcomes: "",
  best_practices_identified: "",
  // Future
  future_tasks: "",
  recommendations: "",
  improvements_needed: "",
  // Additional
  general_notes: "",
  conclusion: "",
  acknowledgments: "",
  // Complex fields
  assignments: [],
  action_items: [],
  // Status
  report_status: "draft",
};

// Field helpers: t = textarea, n = number, s = single-line text
const t = (key, label, placeholder, rows = 4) => ({ key, label, placeholder, rows, type: "textarea" });
const n = (key, label, placeholder = "0", extra = {}) => ({ key, label, placeholder, type: "number", ...extra });
const s = (key, label, placeholder) => ({ key, label, placeholder, type: "text" });

// The form, section by section. `numbers` render side by side; `fields` stack.
const SECTIONS = [
  {
    id: "summary",
    title: "الملخص",
    fields: [
      t("executive_summary", "الملخص التنفيذي", "ملخص شامل عن الحدث، الأهداف المحققة، والنتائج الرئيسية...", 6),
      t("key_achievements", "الإنجازات الرئيسية", "أهم الإنجازات والنجاحات التي تحققت خلال الحدث...", 5),
      t("critical_issues", "القضايا الحرجة", "المشاكل الحرجة أو العوائق الكبيرة التي حدثت...", 5),
    ],
  },
  {
    id: "attendance",
    title: "الحضور والمكان",
    numbers: [
      n("total_attendees", "الحضور المتوقع"),
      n("registered_attendees", "عدد المسجلين"),
      n("actual_attendees", "الحضور الفعلي"),
    ],
    fields: [
      s("venue_name", "اسم المكان", "اسم القاعة أو المركز..."),
      t("venue_feedback", "تقييم المكان", "تقييم المكان من حيث المساحة، التجهيزات، الموقع...", 3),
    ],
  },
  {
    id: "performance",
    title: "المواعيد والبرنامج",
    numbers: [
      n("total_appointments", "إجمالي المواعيد"),
      n("completed_appointments", "المواعيد المكتملة"),
      n("cancelled_appointments", "لم يحضروا"),
      n("no_show_appointments", "عدم الحضور"),
    ],
    fields: [
      t("program_highlights", "أبرز فقرات البرنامج", "الفقرات الأكثر نجاحاً وتفاعلاً من البرنامج..."),
      t("speaker_performance", "أداء المتحدثين والمقدمين", "تقييم أداء المتحدثين والمقدمين..."),
      t("session_feedback", "تقييم الجلسات", "ملاحظات حول الجلسات والورش..."),
    ],
  },
  {
    id: "team",
    title: "الفريق والتكليفات",
    numbers: [n("total_staff", "عدد الموظفين"), n("total_volunteers", "عدد المتطوعين")],
    fields: [
      t("team_performance_notes", "ملاحظات أداء الفريق", "تقييم عام لأداء الفريق، التنسيق، الالتزام..."),
      t("outstanding_team_members", "أعضاء الفريق المتميزون", "أسماء الأعضاء المتميزين وإنجازاتهم...", 3),
    ],
    list: "assignments",
  },
  {
    id: "logistics",
    title: "اللوجستيات والعمليات",
    fields: [
      t("logistics_summary", "ملخص اللوجستيات", "نظرة عامة على الترتيبات اللوجستية...", 3),
      t("transportation_notes", "النقل والمواصلات", "ترتيبات النقل، المواصلات، المواقف...", 3),
      t("accommodation_notes", "الإقامة", "الفنادق، السكن، الترتيبات...", 3),
      t("catering_notes", "الضيافة والطعام", "الوجبات، المشروبات، جودة الخدمة...", 3),
      t("equipment_notes", "المعدات والتجهيزات", "الأجهزة، الصوتيات، الإضاءة، التقنيات...", 3),
    ],
  },
  {
    id: "technical",
    title: "التقنية والأمن",
    fields: [
      t("technical_issues", "المشاكل التقنية", "المشاكل التقنية التي حدثت...", 3),
      t("technical_solutions", "الحلول التقنية المطبقة", "كيف تم حل المشاكل التقنية...", 3),
      t("infrastructure_notes", "البنية التحتية", "الإنترنت، الكهرباء، المرافق...", 3),
      t("security_measures", "الإجراءات الأمنية", "الإجراءات الأمنية المطبقة...", 3),
      t("safety_incidents", "حوادث السلامة", "أي حوادث أو مشاكل تتعلق بالسلامة...", 3),
      t("health_protocols", "البروتوكولات الصحية", "الإجراءات الصحية والوقائية المطبقة...", 3),
    ],
  },
  {
    id: "financial",
    title: "الميزانية",
    numbers: [
      n("planned_budget", "الميزانية المخططة (دج)", "0.00", { step: "0.01" }),
      n("actual_expenses", "النفقات الفعلية (دج)", "0.00", { step: "0.01" }),
    ],
    budgetDiff: true,
    fields: [
      t("major_expenses", "النفقات الرئيسية", "تفاصيل النفقات الرئيسية: الإيجار، الضيافة، النقل، المعدات...", 5),
      t("cost_saving_measures", "إجراءات توفير التكاليف", "الإجراءات المتخذة لتوفير التكاليف والنتائج..."),
    ],
  },
  {
    id: "sponsors",
    title: "الرعاة والشراكات",
    fields: [
      t("sponsors_list", "الرعاة والشركاء", "أسماء الرعاة والشركاء ومستويات الرعاية..."),
      t("partnership_outcomes", "نتائج الشراكات", "الفوائد والنتائج المحققة من الشراكات..."),
      t("sponsor_feedback", "ملاحظات الرعاة", "تعليقات ورضا الرعاة عن الحدث..."),
    ],
  },
  {
    id: "marketing",
    title: "التسويق والإعلام",
    numbers: [
      n("social_media_reach", "الوصول عبر وسائل التواصل", "عدد الأشخاص"),
      n("social_media_engagement", "التفاعل عبر وسائل التواصل", "الإعجابات والتعليقات"),
      n("media_mentions", "الإشارات الإعلامية"),
    ],
    fields: [
      t("marketing_channels_used", "قنوات التسويق المستخدمة", "وسائل التواصل، البريد، الإعلانات، المنشورات..."),
      t("marketing_effectiveness", "فعالية التسويق", "تقييم فعالية الحملات التسويقية والنتائج..."),
      t("media_outlets", "وسائل الإعلام", "القنوات، الصحف، المواقع التي غطت الحدث..."),
      t("media_highlights", "أبرز التغطيات الإعلامية", "أهم التقارير والتغطيات الإعلامية..."),
    ],
  },
  {
    id: "feedback",
    title: "تقييم الحضور",
    numbers: [n("overall_satisfaction_rating", "الرضا العام (من 5)", "0.0", { step: "0.1", min: "0", max: "5" })],
    fields: [
      t("positive_feedback_summary", "التعليقات الإيجابية", "أهم التعليقات والآراء الإيجابية من الحضور...", 5),
      t("negative_feedback_summary", "التعليقات السلبية", "الشكاوى والانتقادات والمشاكل التي ذكرها الحضور...", 5),
      t("attendee_suggestions", "اقتراحات الحضور", "اقتراحات وأفكار الحضور للتحسين...", 5),
    ],
  },
  {
    id: "analysis",
    title: "التحليل والدروس المستفادة",
    fields: [
      t("positive_points", "النقاط الإيجابية", "اكتب النقاط الإيجابية للحدث...", 5),
      t("negative_points", "النقاط السلبية", "اكتب النقاط السلبية والتحديات...", 5),
      t("challenges_faced", "التحديات التي واجهناها", "التحديات والعقبات التي واجهها الفريق...", 5),
      t("solutions_implemented", "الحلول المطبقة", "الحلول التي تم تطبيقها لمواجهة التحديات...", 5),
      t("what_went_well", "ما الذي سار بشكل جيد؟", "الجوانب والعمليات التي نجحت بشكل ممتاز..."),
      t("what_went_wrong", "ما الذي لم يسر بشكل جيد؟", "الجوانب التي لم تسر كما هو مخطط..."),
      t("unexpected_outcomes", "النتائج غير المتوقعة", "المفاجآت والنتائج غير المتوقعة..."),
      t("best_practices_identified", "أفضل الممارسات", "الممارسات الناجحة التي يجب تطبيقها مستقبلاً..."),
    ],
  },
  {
    id: "future",
    title: "التخطيط وبنود العمل",
    fields: [
      t("future_tasks", "المهام المستقبلية", "المهام والأعمال المطلوبة للمتابعة...", 5),
      t("recommendations", "التوصيات", "التوصيات للأحداث القادمة...", 5),
      t("improvements_needed", "التحسينات المطلوبة", "المجالات التي تحتاج إلى تحسين...", 5),
    ],
    list: "action_items",
  },
  {
    id: "notes",
    title: "الخلاصة والشكر",
    fields: [
      t("general_notes", "ملاحظات عامة", "أي ملاحظات أو تعليقات إضافية..."),
      t("conclusion", "الخلاصة", "خلاصة شاملة للحدث والنتائج...", 5),
      t("acknowledgments", "شكر وتقدير", "شكر الأفراد والجهات المساهمة..."),
    ],
  },
];

const PRIORITIES = { high: "عالية", medium: "متوسطة", low: "منخفضة" };

const NEW_ROW = {
  assignments: () => ({ name: "", phone: "", role: "", task: "", performance_notes: "" }),
  action_items: () => ({ task: "", priority: "medium", deadline: "", assignee: "" }),
};

const LIST_COPY = {
  assignments: { title: "التكليفات والمسؤوليات", item: "تكليف", add: "أضف تكليفاً", empty: "لا توجد تكليفات بعد." },
  action_items: { title: "بنود العمل", item: "بند", add: "أضف بنداً", empty: "لا توجد بنود عمل بعد." },
};

const filled = (value) => value !== null && value !== undefined && String(value).trim() !== "";
const textareaClass = cx(inputClass, "h-auto py-2.5 leading-relaxed resize-y");

const budgetDiff = (data) =>
  filled(data.planned_budget) && filled(data.actual_expenses)
    ? (parseFloat(data.actual_expenses) - parseFloat(data.planned_budget)).toFixed(2)
    : "";

const metadataFrom = (report) => ({
  created_at: report.created_at,
  updated_at: report.updated_at,
  created_by: report.creator,
  updated_by: report.updater,
  approved_by: report.approver,
  approved_at: report.approved_at,
});

const formatDate = (dateString) => {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleDateString("ar-DZ", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

// ------------------------------------------------------------ Small parts

function ReadValue({ label, value }) {
  return (
    <div className="py-2.5">
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="mt-0.5 text-sm text-ink whitespace-pre-wrap break-words">{value}</dd>
    </div>
  );
}

function FormField({ field, value, onChange }) {
  const common = {
    value: value ?? "",
    onChange: (e) => onChange(field.key, e.target.value),
    placeholder: field.placeholder,
  };
  return (
    <Field label={field.label}>
      {field.type === "textarea" ? (
        <textarea className={textareaClass} rows={field.rows} {...common} />
      ) : field.type === "number" ? (
        <TextInput type="number" inputMode="decimal" step={field.step} min={field.min} max={field.max} {...common} />
      ) : (
        <TextInput type="text" {...common} />
      )}
    </Field>
  );
}

// ---------------------------------------------------------------- Screen

export default function EventReport() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { token } = useContext(AppContext);
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [saving, setSaving] = useState(false);
  const [busy, setBusy] = useState(false);
  const [event, setEvent] = useState(null);
  const [, setStatistics] = useState(null);

  const [isEditMode, setIsEditMode] = useState(false);
  const [reportExists, setReportExists] = useState(false);
  const [reportMetadata, setReportMetadata] = useState(null);
  const [formData, setFormData] = useState(EMPTY_REPORT);

  const [openSections, setOpenSections] = useState(() => new Set([SECTIONS[0].id]));
  const [confirm, setConfirm] = useState(null); // 'approve' | 'delete' | 'discard' | { list, index }

  const backTo = `/admin/event-tracking/${eventId}`;

  useEffect(() => {
    fetchReport();
    // eslint-disable-next-line
  }, [eventId]);

  const fetchReport = async () => {
    setLoading(true);
    setLoadError("");
    try {
      const res = await fetch(`${apiUrl}/api/events/${eventId}/report`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (res.ok) {
        setEvent(data.event);
        setStatistics(data.statistics);

        if (data.report) {
          // Report exists: view mode
          setReportExists(true);
          setIsEditMode(false);
          setReportMetadata(metadataFrom(data.report));
          setFormData({
            ...EMPTY_REPORT,
            ...data.report,
            assignments: data.report.assignments || [],
            action_items: data.report.action_items || [],
          });
        } else {
          // No report yet: edit mode, pre-filled with the event statistics
          setReportExists(false);
          setIsEditMode(true);
          setReportMetadata(null);
          setFormData({
            ...EMPTY_REPORT,
            ...(data.statistics
              ? {
                  total_appointments: data.statistics.total_appointments || "",
                  completed_appointments: data.statistics.completed_appointments || "",
                  cancelled_appointments: data.statistics.cancelled_appointments || "",
                }
              : {}),
          });
        }
      } else {
        setLoadError(data.message || "تعذر تحميل التقرير.");
      }
    } catch (error) {
      console.error("Error fetching report:", error);
      setLoadError("تعذر الاتصال بالخادم. تحقق من الشبكة ثم أعد المحاولة.");
    } finally {
      setLoading(false);
    }
  };

  /** Saves the whole form. Returns true on success. */
  const saveReport = async ({ quiet = false } = {}) => {
    setSaving(true);
    try {
      const res = await fetch(`${apiUrl}/api/events/${eventId}/report`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });
      const data = await res.json();

      if (res.ok) {
        if (!quiet) toast(reportExists ? "حُفظت التعديلات." : "حُفظ التقرير كمسودة.");
        setFormData((prev) => ({ ...prev, ...data.report }));
        setReportExists(true);
        setIsEditMode(false);
        setReportMetadata(metadataFrom(data.report));
        return true;
      }
      toast(data.message || "تعذر حفظ التقرير. راجع الحقول ثم أعد المحاولة.", "error");
      return false;
    } catch (error) {
      console.error("Error saving report:", error);
      toast("تعذر الاتصال بالخادم. لم يُحفظ التقرير، أعد المحاولة.", "error");
      return false;
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    saveReport();
  };

  // Approving locks the report. Unsaved changes are saved first.
  const handleApprove = async () => {
    setBusy(true);
    try {
      if (isEditMode && !(await saveReport({ quiet: true }))) return;

      const res = await fetch(`${apiUrl}/api/events/${eventId}/report/approve`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      const data = await res.json();

      if (res.ok) {
        toast("اعتُمد التقرير. لم يعد قابلاً للتعديل.");
        setFormData((prev) => ({ ...prev, report_status: "approved" }));
        setIsEditMode(false);
        if (data.report) {
          setReportMetadata((prev) => ({
            ...prev,
            approved_by: data.report.approver,
            approved_at: data.report.approved_at,
          }));
        }
      } else {
        toast(data.message || "تعذر اعتماد التقرير.", "error");
      }
    } catch (error) {
      toast("تعذر الاتصال بالخادم. لم يُعتمد التقرير، أعد المحاولة.", "error");
    } finally {
      setBusy(false);
      setConfirm(null);
    }
  };

  const handleDelete = async () => {
    setBusy(true);
    try {
      const res = await fetch(`${apiUrl}/api/events/${eventId}/report`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (res.ok) {
        toast("حُذف التقرير.");
        navigate(backTo);
      } else {
        toast(data.message || "تعذر حذف التقرير.", "error");
      }
    } catch (error) {
      toast("تعذر الاتصال بالخادم. لم يُحذف التقرير.", "error");
    } finally {
      setBusy(false);
      setConfirm(null);
    }
  };

  const discardChanges = () => {
    setConfirm(null);
    fetchReport(); // reload the saved version
  };

  const handlePrintHTML = () => {
    const html = generatePrintableHTML(event, formData, reportMetadata);
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast(POPUP_BLOCKED, "error");
      return;
    }
    writePrintDocument(printWindow, html);
    // Wait for content to load, then print
    printWindow.onload = function () {
      printWindow.focus();
      printWindow.print();
    };
  };

  const handleDownloadHTML = () => {
    const html = generatePrintableHTML(event, formData, reportMetadata);
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `تقرير-${event?.name || "الحدث"}-${new Date().toISOString().split("T")[0]}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // ------------------------------------------------------------ Form state

  const updateField = (field, value) => setFormData((prev) => ({ ...prev, [field]: value }));

  const addRow = (list) => setFormData((prev) => ({ ...prev, [list]: [...prev[list], NEW_ROW[list]()] }));

  const updateRow = (list, index, field, value) =>
    setFormData((prev) => ({
      ...prev,
      [list]: prev[list].map((row, i) => (i === index ? { ...row, [field]: value } : row)),
    }));

  const removeRow = (list, index) => {
    setFormData((prev) => ({ ...prev, [list]: prev[list].filter((_, i) => i !== index) }));
    setConfirm(null);
  };

  const askRemoveRow = (list, index) => {
    const row = formData[list][index];
    const hasContent = Object.entries(row).some(([key, v]) => key !== "priority" && filled(v));
    if (hasContent) setConfirm({ list, index });
    else removeRow(list, index);
  };

  const toggleSection = (id) =>
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const allOpen = openSections.size === SECTIONS.length;

  if (loading) return <LoadingState />;

  if (loadError) {
    return (
      <div className="max-w-2xl mx-auto">
        <BackLink to={backTo} />
        <PageHeader title="تقرير الحدث" />
        <ErrorState message={loadError} onRetry={fetchReport} />
      </div>
    );
  }

  const isApproved = formData.report_status === "approved";
  const canEdit = reportExists && !isApproved;
  const editing = isEditMode && !isApproved;

  const eventDate = event?.start_date || event?.date;

  const sectionStats = (section) => {
    const keys = [...(section.numbers || []), ...section.fields].map((f) => f.key);
    const done = keys.filter((k) => filled(formData[k])).length + (section.list && formData[section.list].length ? 1 : 0);
    return { done, total: keys.length + (section.list ? 1 : 0) };
  };

  // --------------------------------------------------------------- Lists

  const renderList = (list) => {
    const copy = LIST_COPY[list];
    const rows = formData[list] || [];
    return (
      <div className="mt-4 pt-4 border-t border-line">
        <div className="flex items-center justify-between gap-2 mb-2">
          <h3 className="font-semibold text-ink">{copy.title}</h3>
          {editing && (
            <Button variant="secondary" size="sm" icon={Plus} onClick={() => addRow(list)}>
              {copy.add}
            </Button>
          )}
        </div>

        {rows.length === 0 ? (
          <p className="text-sm text-muted py-2">{copy.empty}</p>
        ) : (
          <ol className="space-y-3">
            {rows.map((row, index) => (
              <li key={index} className="rounded-xl border border-line p-3">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-sm font-semibold text-ink">
                    {copy.item} {index + 1}
                    {list === "action_items" && !editing && (
                      <span className="ms-2 text-xs font-normal text-muted">الأولوية: {PRIORITIES[row.priority] || PRIORITIES.medium}</span>
                    )}
                  </span>
                  {editing && (
                    <IconButton icon={Trash2} label={`احذف ${copy.item} ${index + 1}`} className="-me-2 text-red-700" onClick={() => askRemoveRow(list, index)} />
                  )}
                </div>

                {list === "assignments" ? (
                  editing ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Field label="الاسم">
                        <TextInput value={row.name ?? ""} onChange={(e) => updateRow(list, index, "name", e.target.value)} placeholder="اسم المسؤول" />
                      </Field>
                      <Field label="رقم الهاتف">
                        <TextInput type="tel" dir="ltr" value={row.phone ?? ""} onChange={(e) => updateRow(list, index, "phone", e.target.value)} placeholder="0123456789" />
                      </Field>
                      <Field label="الدور">
                        <TextInput value={row.role ?? ""} onChange={(e) => updateRow(list, index, "role", e.target.value)} placeholder="منسق، متطوع، مشرف..." />
                      </Field>
                      <Field label="المهمة">
                        <TextInput value={row.task ?? ""} onChange={(e) => updateRow(list, index, "task", e.target.value)} placeholder="وصف المهمة" />
                      </Field>
                      <Field label="ملاحظات الأداء" className="sm:col-span-2">
                        <textarea className={textareaClass} rows={2} value={row.performance_notes ?? ""} onChange={(e) => updateRow(list, index, "performance_notes", e.target.value)} placeholder="تقييم الأداء وملاحظات إضافية..." />
                      </Field>
                    </div>
                  ) : (
                    <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
                      <ReadValue label="الاسم" value={row.name || "—"} />
                      <ReadValue label="رقم الهاتف" value={row.phone || "—"} />
                      {filled(row.role) && <ReadValue label="الدور" value={row.role} />}
                      <ReadValue label="المهمة" value={row.task || "—"} />
                      {filled(row.performance_notes) && <ReadValue label="ملاحظات الأداء" value={row.performance_notes} />}
                    </dl>
                  )
                ) : editing ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Field label="المهمة" className="sm:col-span-2">
                      <textarea className={textareaClass} rows={2} value={row.task ?? ""} onChange={(e) => updateRow(list, index, "task", e.target.value)} placeholder="وصف المهمة..." />
                    </Field>
                    <Field label="الأولوية">
                      <SelectInput value={row.priority || "medium"} onChange={(e) => updateRow(list, index, "priority", e.target.value)}>
                        <option value="high">عالية</option>
                        <option value="medium">متوسطة</option>
                        <option value="low">منخفضة</option>
                      </SelectInput>
                    </Field>
                    <Field label="الموعد النهائي">
                      <TextInput type="date" value={row.deadline ?? ""} onChange={(e) => updateRow(list, index, "deadline", e.target.value)} />
                    </Field>
                    <Field label="المكلّف" className="sm:col-span-2">
                      <TextInput value={row.assignee ?? ""} onChange={(e) => updateRow(list, index, "assignee", e.target.value)} placeholder="اسم المسؤول عن المهمة..." />
                    </Field>
                  </div>
                ) : (
                  <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
                    <ReadValue label="المهمة" value={row.task || "—"} />
                    {filled(row.assignee) && <ReadValue label="المكلّف" value={row.assignee} />}
                    {filled(row.deadline) && <ReadValue label="الموعد النهائي" value={row.deadline} />}
                  </dl>
                )}
              </li>
            ))}
          </ol>
        )}
      </div>
    );
  };

  // ------------------------------------------------------------ Sections

  const renderSectionBody = (section) => {
    const numbers = section.numbers || [];

    if (editing) {
      return (
        <div className="space-y-4">
          {numbers.length > 0 && (
            <div className={cx("grid gap-3", numbers.length === 1 ? "grid-cols-1" : "grid-cols-2", numbers.length >= 3 && "sm:grid-cols-3", numbers.length === 4 && "sm:grid-cols-4")}>
              {numbers.map((field) => (
                <FormField key={field.key} field={field} value={formData[field.key]} onChange={updateField} />
              ))}
              {section.budgetDiff && (
                <Field label="الفرق (دج)" hint="النفقات ناقص الميزانية، يُحسب تلقائياً" className="col-span-2 sm:col-span-1">
                  <TextInput value={budgetDiff(formData)} readOnly disabled placeholder="0.00" />
                </Field>
              )}
            </div>
          )}
          {section.fields.map((field) => (
            <FormField key={field.key} field={field} value={formData[field.key]} onChange={updateField} />
          ))}
          {section.list && renderList(section.list)}
        </div>
      );
    }

    const shownNumbers = numbers.filter((f) => filled(formData[f.key]));
    const shownFields = section.fields.filter((f) => filled(formData[f.key]));
    const diff = section.budgetDiff ? budgetDiff(formData) : "";
    const hasList = section.list && formData[section.list].length > 0;

    if (!shownNumbers.length && !shownFields.length && !hasList) {
      return <p className="text-sm text-muted py-1">لم يُكتب شيء في هذا القسم.</p>;
    }

    return (
      <>
        {(shownNumbers.length > 0 || diff) && (
          <dl className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-2">
            {shownNumbers.map((f) => (
              <div key={f.key} className="rounded-xl bg-paper px-3 py-2">
                <dt className="text-xs text-muted leading-snug">{f.label}</dt>
                <dd className="font-display text-xl text-ink">{formData[f.key]}</dd>
              </div>
            ))}
            {diff && (
              <div className="rounded-xl bg-paper px-3 py-2">
                <dt className="text-xs text-muted leading-snug">الفرق (دج)</dt>
                <dd className="font-display text-xl text-ink" dir="ltr">{diff}</dd>
              </div>
            )}
          </dl>
        )}
        {shownFields.length > 0 && (
          <dl className="divide-y divide-line">
            {shownFields.map((f) => (
              <ReadValue key={f.key} label={f.label} value={formData[f.key]} />
            ))}
          </dl>
        )}
        {section.list && renderList(section.list)}
      </>
    );
  };

  const confirmRow = confirm && typeof confirm === "object" ? confirm : null;

  return (
    <div className="max-w-2xl mx-auto">
      <BackLink to={backTo} />
      <PageHeader
        title={reportExists ? (editing ? "تعديل تقرير الحدث" : "تقرير الحدث") : "تقرير جديد"}
        subtitle={[event?.name, eventDate ? new Date(eventDate).toLocaleDateString("ar-DZ") : null].filter(Boolean).join("، ")}
        actions={
          <ActionsMenu
            title="التقرير"
            actions={[
              reportExists && { icon: Printer, label: "اطبع التقرير", hint: editing ? "يطبع آخر نسخة على الشاشة" : undefined, onClick: handlePrintHTML },
              reportExists && { icon: FileDown, label: "نزّل التقرير كملف HTML", onClick: handleDownloadHTML },
              editing && { icon: Undo2, label: "تجاهل التعديلات", hint: "يعيد آخر نسخة محفوظة", onClick: () => setConfirm("discard") },
              canEdit && { icon: Trash2, label: "احذف التقرير", tone: "text-red-700", onClick: () => setConfirm("delete") },
            ]}
          />
        }
      />

      {/* Status and history */}
      {reportExists && (
        <div className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
          <span
            className={cx(
              "inline-flex items-center gap-1 h-6 px-2 rounded-md text-xs font-semibold",
              isApproved ? "bg-st-queue-bg text-st-queue" : "bg-st-pushed-bg text-st-pushed"
            )}
          >
            {isApproved && <Lock className="w-3.5 h-3.5" />}
            {isApproved ? "معتمد" : "مسودة"}
          </span>
          {reportMetadata?.created_by && <span>أنشأه {reportMetadata.created_by.name}</span>}
          {reportMetadata?.created_at && <span>في {formatDate(reportMetadata.created_at)}</span>}
          {reportMetadata?.updated_by && <span>آخر تعديل: {reportMetadata.updated_by.name}</span>}
          {reportMetadata?.approved_by && (
            <span>
              اعتمده {reportMetadata.approved_by.name}
              {reportMetadata.approved_at && ` في ${formatDate(reportMetadata.approved_at)}`}
            </span>
          )}
        </div>
      )}

      {isApproved && (
        <p className="mb-4 flex items-start gap-2 rounded-2xl bg-white border border-line px-4 py-3 text-sm text-ink">
          <Lock className="w-4 h-4 mt-0.5 shrink-0 text-muted" />
          هذا التقرير معتمد، يمكنك قراءته وطباعته فقط.
        </p>
      )}

      <form onSubmit={handleSubmit}>
        <div className="flex justify-end mb-2">
          <button
            type="button"
            onClick={() => setOpenSections(allOpen ? new Set() : new Set(SECTIONS.map((sec) => sec.id)))}
            className="min-h-[2.75rem] px-1 text-sm font-semibold text-ink"
          >
            {allOpen ? "اطوِ كل الأقسام" : "افتح كل الأقسام"}
          </button>
        </div>

        <div className="space-y-3">
          {SECTIONS.map((section, i) => {
            const open = openSections.has(section.id);
            const { done, total } = sectionStats(section);
            return (
              <section key={section.id} className="bg-white border border-line rounded-2xl">
                <h2>
                  <button
                    type="button"
                    onClick={() => toggleSection(section.id)}
                    aria-expanded={open}
                    aria-controls={`report-${section.id}`}
                    className="w-full flex items-center gap-3 min-h-[3.5rem] px-4 text-start"
                  >
                    <span className="w-6 text-sm text-muted">{i + 1}</span>
                    <span className="flex-1 min-w-0 font-semibold text-ink">{section.title}</span>
                    <span className={cx("text-xs", done === 0 ? "text-muted" : "text-ink")}>
                      {done} من {total}
                    </span>
                    <ChevronDown className={cx("w-5 h-5 text-muted shrink-0 transition-transform", open && "rotate-180")} />
                  </button>
                </h2>
                {open && (
                  <div id={`report-${section.id}`} className="px-4 pb-4">
                    {renderSectionBody(section)}
                  </div>
                )}
              </section>
            );
          })}
        </div>

        {!isApproved && (
          <FormActionBar>
            {editing ? (
              <>
                <Button type="submit" icon={Save} className="flex-1" loading={saving} disabled={busy}>
                  احفظ المسودة
                </Button>
                <Button variant="secondary" icon={Lock} className="flex-1" disabled={saving || busy} onClick={() => setConfirm("approve")}>
                  اعتمد التقرير
                </Button>
              </>
            ) : (
              <>
                <Button variant="secondary" icon={Edit} className="flex-1" onClick={() => setIsEditMode(true)} disabled={!canEdit}>
                  عدّل التقرير
                </Button>
                <Button icon={Lock} className="flex-1" onClick={() => setConfirm("approve")} disabled={busy}>
                  اعتمد التقرير
                </Button>
              </>
            )}
          </FormActionBar>
        )}
      </form>

      <ConfirmSheet
        open={confirm === "approve"}
        onClose={() => setConfirm(null)}
        title="اعتماد التقرير"
        confirmLabel="اعتمد التقرير"
        danger={false}
        loading={busy}
        onConfirm={handleApprove}
      >
        <p>بعد الاعتماد يُقفل التقرير ولا يمكن تعديله أو حذفه.</p>
        {editing && <p className="text-muted">ستُحفظ تعديلاتك الحالية أولاً.</p>}
      </ConfirmSheet>

      <ConfirmSheet
        open={confirm === "delete"}
        onClose={() => setConfirm(null)}
        title="حذف التقرير"
        confirmLabel="احذف التقرير"
        loading={busy}
        onConfirm={handleDelete}
      >
        <p>سيُحذف تقرير «{event?.name}» نهائياً، ولا يمكن التراجع عن ذلك.</p>
      </ConfirmSheet>

      <ConfirmSheet
        open={confirm === "discard"}
        onClose={() => setConfirm(null)}
        title="تجاهل التعديلات"
        confirmLabel="تجاهل التعديلات"
        onConfirm={discardChanges}
      >
        <p>ستضيع التغييرات غير المحفوظة ويعود التقرير إلى آخر نسخة محفوظة.</p>
      </ConfirmSheet>

      <ConfirmSheet
        open={!!confirmRow}
        onClose={() => setConfirm(null)}
        title={confirmRow ? `حذف ${LIST_COPY[confirmRow.list].item} ${confirmRow.index + 1}` : ""}
        confirmLabel="احذف"
        onConfirm={() => confirmRow && removeRow(confirmRow.list, confirmRow.index)}
      >
        <p>سيُحذف هذا السطر من التقرير عند الحفظ.</p>
      </ConfirmSheet>
    </div>
  );
}
