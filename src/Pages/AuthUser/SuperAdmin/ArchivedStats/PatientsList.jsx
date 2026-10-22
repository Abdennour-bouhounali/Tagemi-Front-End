import { API_BASE_URL } from '../../../../config/environment';
// Archived event: every appointment, server-paginated, with filters.
import React, { useState, useEffect, useContext } from "react";
import { escapeHtml, csvSafe } from "../../../../utils/safeHtml";
import { useParams } from "react-router-dom";
import { AppContext } from "../../../../Context/AppContext";
import { ChevronLeft, ChevronRight, Download, Printer, SlidersHorizontal } from "lucide-react";
import {
  Button, ChipGroup, EmptyState, Field, LoadingState, PageHeader, Panel, SearchField, SelectInput, Sheet, useToast, cx,
} from "../../../../Components/ui";
import { ActionsMenu, ARCHIVED_OUTCOMES, BackLink, ErrorState, POPUP_BLOCKED, printHtml } from "../../../../Components/ui/StatsKit";

const apiUrl = API_BASE_URL;

// Final outcome of an archived appointment (same as StatusStats / VisitStatistics::outcomeOf)
const OUTCOMES = {
  Completed: { label: ARCHIVED_OUTCOMES.Completed.label, tone: "bg-st-queue-bg text-st-queue" },
  Pending: { label: ARCHIVED_OUTCOMES.Pending.label, tone: "bg-st-pending-bg text-st-pending" },
  Waiting: { label: ARCHIVED_OUTCOMES.Waiting.label, tone: "bg-st-pushed-bg text-st-pushed" },
};

const outcomeOf = (status) => (status === 'Completed' || status === 'Pending' ? status : 'Waiting');

function OutcomeBadge({ status }) {
  const outcome = OUTCOMES[outcomeOf(status)];
  return (
    <span className={cx("inline-flex items-center h-6 px-2 rounded-md text-xs font-semibold whitespace-nowrap", outcome.tone)}>
      {outcome.label}
    </span>
  );
}

const sexLabel = (sex) => (sex === '0' ? 'ذكر' : 'أنثى');
const formatBirthday = (value) => (value ? new Date(value).toLocaleDateString('en-UK') : '—');

function Detail({ label, children }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5">
      <dt className="text-sm text-muted">{label}</dt>
      <dd className="text-sm font-semibold text-ink text-end">{children || '—'}</dd>
    </div>
  );
}

const STATUS_OPTIONS = [
  { value: "", label: "الكل" },
  { value: "Completed", label: OUTCOMES.Completed.label },
  { value: "Pending", label: OUTCOMES.Pending.label },
];

const PatientsList = () => {
  const { eventId } = useParams();
  const { token } = useContext(AppContext);
  const toast = useToast();
  
  const [event, setEvent] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [specialties, setSpecialties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Filters
  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [specialtyFilter, setSpecialtyFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [perPage, setPerPage] = useState(50);
  const [total, setTotal] = useState(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selected, setSelected] = useState(null);

  // Wait for a pause in typing before asking the server (weak networks)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput.trim() !== searchTerm) {
        setSearchTerm(searchInput.trim());
        setCurrentPage(1);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput, searchTerm]);

  useEffect(() => {
    fetchEvent();
    fetchSpecialties();
  }, [eventId]);

  useEffect(() => {
    fetchPatients();
  }, [eventId, searchTerm, statusFilter, specialtyFilter, currentPage, perPage]);

  const fetchEvent = async () => {
    try {
      const res = await fetch(`${apiUrl}/api/events/${eventId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setEvent(data.event || data);
      }
    } catch (err) {
      console.error("Error fetching event:", err);
    }
  };

  const fetchSpecialties = async () => {
    try {
      const res = await fetch(`${apiUrl}/api/events/${eventId}/specialties`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      
      if (res.ok) {
        const uniqueSpecialties = [];
        const specialtyIds = new Set();
        
        (data.event_specialties || []).forEach(es => {
          if (es.specialty && !specialtyIds.has(es.specialty.id)) {
            specialtyIds.add(es.specialty.id);
            uniqueSpecialties.push(es.specialty);
          }
        });
        
        setSpecialties(uniqueSpecialties);
      }
    } catch (err) {
      console.error("Error fetching specialties:", err);
    }
  };

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage,
        per_page: perPage,
      });
      
      if (searchTerm) params.append('search', searchTerm);
      if (statusFilter) params.append('status', statusFilter);
      if (specialtyFilter) params.append('specialty_id', specialtyFilter);

      const res = await fetch(`${apiUrl}/api/archived-events/${eventId}/patients-list?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      
      if (res.ok) {
        setAppointments(data.appointments.data);
        setTotalPages(data.appointments.last_page || 1);
        setTotal(data.appointments.total ?? null);
        setError("");
      } else {
        setError(data.message || "فشل في تحميل البيانات");
      }
    } catch (err) {
      console.error("Error:", err);
      setError("حدث خطأ أثناء تحميل البيانات");
    } finally {
      setLoading(false);
    }
  };

const handlePrint = () => {
  if (!printHtml(generatePrintDocument())) toast(POPUP_BLOCKED, "error");
};

const generatePrintDocument = () => {
  const currentDate = new Date().toLocaleDateString('ar-EG', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const getStatusLabel = (status) => OUTCOMES[outcomeOf(status)].label;
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-UK');
    } catch (e) {
      return dateString;
    }
  };

  return `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
      <meta charset="UTF-8">
      <title>قائمة المرضى - ${escapeHtml(event?.name)}</title>
      <style>
        @page { size: A4 landscape; margin: 1.5cm; }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Arial', 'Tahoma', sans-serif; line-height: 1.6; color: #333; background: white; }
        
        .header {
          text-align: center;
          padding: 20px 0;
          border-bottom: 3px solid #6366f1;
          margin-bottom: 25px;
        }
        .logo { width: 100px; height: auto; margin-bottom: 12px; }
        .header h1 { font-size: 26px; color: #6366f1; margin-bottom: 6px; font-weight: bold; }
        .header .event-name { font-size: 16px; color: #666; margin-bottom: 4px; }
        .header .date { font-size: 12px; color: #999; }
        
        .summary-box {
          padding: 15px;
          background: linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%);
          border-radius: 8px;
          margin-bottom: 20px;
          text-align: center;
        }
        .summary-box .value { font-size: 24px; font-weight: bold; color: #6366f1; }
        .summary-box .label { font-size: 13px; color: #666; margin-top: 5px; }
        
        .data-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 11px;
        }
        .data-table th {
          background-color: #6366f1;
          color: white;
          padding: 10px 6px;
          text-align: center;
          font-weight: bold;
          font-size: 12px;
        }
        .data-table td {
          border: 1px solid #e5e7eb;
          padding: 8px 6px;
          text-align: center;
        }
        .data-table tr:nth-child(even) { background-color: #f9fafb; }
        .data-table tr:hover { background-color: #f3f4f6; }
        
        .status-badge {
          padding: 3px 8px;
          border-radius: 10px;
          font-size: 10px;
          font-weight: bold;
          display: inline-block;
        }
        .status-completed { background-color: #dcfce7; color: #16a34a; }
        .status-cancelled { background-color: #fee2e2; color: #dc2626; }
        .status-noshow { background-color: #fed7aa; color: #ea580c; }
        .status-pending { background-color: #dbeafe; color: #2563eb; }
        
        .footer {
          margin-top: 30px;
          padding-top: 15px;
          border-top: 2px solid #e5e7eb;
          text-align: center;
          color: #999;
          font-size: 11px;
        }
        
        @media print {
          body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <img src="/tagemi_logo.png" alt="Logo" class="logo" />
        <h1>قائمة المرضى الكاملة</h1>
        <p class="event-name">${escapeHtml(event?.name)}</p>
        <p class="date">تاريخ الإصدار: ${escapeHtml(currentDate)}</p>
      </div>

      <div class="summary-box">
        <div class="value">${appointments.length}</div>
        <div class="label">إجمالي المرضى في هذه الصفحة</div>
      </div>

      <table class="data-table">
        <thead>
          <tr>
            <th style="width: 40px;">الرقم</th>
            <th>الاسم الكامل</th>
            <th>الجنس</th>
            <th>تاريخ الميلاد</th>
            <th>الهاتف</th>
            <th>المدينة</th>
            <th>الولاية</th>
            <th>التخصص</th>
            <th>اليوم</th>
            <th>الساعة</th>
            <th>الحالة</th>
          </tr>
        </thead>
        <tbody>
          ${appointments.map(apt => {
            const statusClass = 
              apt.status === 'Completed' ? 'status-completed' :
              apt.status === 'Pending' ? 'status-cancelled' :
              'status-pending';
            
            return `
              <tr>
                <td><strong>${escapeHtml(apt.id)}</strong></td>
                <td style="text-align: right; padding-right: 10px;"><strong>${escapeHtml(apt.full_name)}</strong></td>
                <td>${apt.sex === '0' ? 'ذكر' : 'أنثى'}</td>
                <td>${escapeHtml(formatDate(apt.birthday) || '-')}</td>
                <td>${escapeHtml(apt.phone || '-')}</td>
                <td>${escapeHtml(apt.city || '-')}</td>
                <td>${escapeHtml(apt.state || '-')}</td>
                <td>${escapeHtml(apt.event_specialty?.specialty?.name || '-')}</td>
                <td>${escapeHtml(apt.day?.day_date || '-')}</td>
                <td>${escapeHtml(apt.hour?.time || '-')}</td>
                <td>
                  <span class="status-badge ${statusClass}">
                    ${escapeHtml(getStatusLabel(apt.status))}
                  </span>
                </td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>

      ${appointments.length === 0 ? '<p style="text-align: center; color: #999; padding: 40px;">لا توجد بيانات للعرض</p>' : ''}

      <div class="footer">
        <p>هذا التقرير تم إنشاؤه تلقائياً بواسطة نظام إدارة الحملات الطبية</p>
        <p>جميع الحقوق محفوظة © ${new Date().getFullYear()}</p>
        <p style="margin-top: 5px;">الصفحة ${currentPage} من ${totalPages} | إجمالي المرضى: ${appointments.length}</p>
      </div>
    </body>
    </html>
  `;
};

  const handleExport = () => {
    const csvContent = [
      ["الرقم", "الاسم الكامل", "تاريخ الميلاد", "الجنس", "الهاتف", "الولاية", "المدينة", "التخصص", "الطبيب", "اليوم", "الساعة", "الحالة"],
      ...appointments.map(apt => [
        apt.id,
        apt.full_name,
        apt.birthday,
        apt.sex === '0' ? 'ذكر' : 'أنثى',
        apt.phone,
        apt.state || '',
        apt.city || '',
        apt.event_specialty?.specialty?.name || '',
        apt.doctor?.name || '',
        apt.day?.name || '',
        apt.hour?.time || '',
        OUTCOMES[outcomeOf(apt.status)]?.label || apt.status
      ])
    ].map(row => row.map(cell => `"${csvSafe(cell).replace(/"/g, '""')}"`).join(",")).join("\n");

    const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `patients_list_${eventId}.csv`;
    link.click();
  };

  const resetFilters = () => {
    setSearchInput("");
    setSearchTerm("");
    setStatusFilter("");
    setSpecialtyFilter("");
    setCurrentPage(1);
  };

  const backTo = `/admin/event-tracking/${eventId}`;
  const specialtyName = specialties.find((sp) => String(sp.id) === String(specialtyFilter))?.name;
  const hasFilters = !!(searchTerm || statusFilter || specialtyFilter);

  if (error && appointments.length === 0) {
    return (
      <div className="max-w-6xl mx-auto">
        <BackLink to={backTo} />
        <PageHeader title="قائمة المرضى" subtitle={event?.name} />
        <ErrorState message={error} onRetry={() => { setError(""); fetchPatients(); }} />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <BackLink to={backTo} />
      <PageHeader
        title="قائمة المرضى"
        subtitle={[event?.name, total !== null ? `${total} موعد` : null].filter(Boolean).join("، ")}
        actions={
          <ActionsMenu
            actions={[
              { icon: Printer, label: "اطبع هذه الصفحة", hint: "المواعيد المعروضة حالياً فقط", onClick: handlePrint, disabled: appointments.length === 0 },
              { icon: Download, label: "نزّل ملف CSV", hint: "المواعيد المعروضة حالياً فقط", onClick: handleExport, disabled: appointments.length === 0 },
            ]}
          />
        }
      />

      {/* Filters */}
      <div className="space-y-3 mb-4">
        <div className="flex gap-2">
          <SearchField
            className="flex-1"
            value={searchInput}
            onChange={setSearchInput}
            placeholder="ابحث بالاسم أو الهاتف أو رقم المريض"
          />
          <button
            type="button"
            onClick={() => setFiltersOpen(true)}
            className={cx(
              "shrink-0 inline-flex items-center gap-2 h-12 px-3 rounded-xl border text-sm font-semibold",
              specialtyFilter ? "bg-ink text-white border-ink" : "bg-white text-ink border-line hover:bg-ink-faint"
            )}
          >
            <SlidersHorizontal className="w-5 h-5" />
            <span className="hidden sm:inline">تصفية إضافية</span>
          </button>
        </div>
        <ChipGroup
          label="النتيجة"
          value={statusFilter}
          onChange={(value) => { setStatusFilter(value); setCurrentPage(1); }}
          options={STATUS_OPTIONS}
        />
        {(specialtyName || hasFilters) && (
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted">
            {specialtyName && <span>التخصص: <span className="font-semibold text-ink">{specialtyName}</span></span>}
            {hasFilters && (
              <button type="button" onClick={resetFilters} className="min-h-[2.75rem] px-1 font-semibold text-ink underline underline-offset-4">
                امسح التصفية
              </button>
            )}
          </div>
        )}
      </div>

      {loading && appointments.length === 0 ? (
        <LoadingState />
      ) : appointments.length === 0 ? (
        <Panel>
          <EmptyState title="لا توجد نتائج">
            {hasFilters ? "غيّر البحث أو امسح التصفية لعرض مواعيد أخرى." : "لا توجد مواعيد مؤرشفة لهذا الحدث."}
          </EmptyState>
        </Panel>
      ) : (
        <div className={cx("bg-white border border-line rounded-2xl overflow-hidden", loading && "opacity-60")} aria-busy={loading}>
          {/* Phones and tablets: tappable rows */}
          <ul className="lg:hidden divide-y divide-line">
            {appointments.map((apt) => (
              <li key={apt.id}>
                <button type="button" onClick={() => setSelected(apt)} className="w-full text-start px-4 py-3 hover:bg-ink-faint">
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-semibold text-ink min-w-0 truncate">{apt.full_name}</p>
                    <OutcomeBadge status={apt.status} />
                  </div>
                  <p className="mt-1 text-xs text-muted">
                    <span className="font-semibold text-ink">#{apt.id}</span>
                    <span className="mx-1.5">|</span>
                    {apt.event_specialty?.specialty?.name || 'بدون تخصص'}
                    {(apt.day?.name || apt.hour?.time) && (
                      <>
                        <span className="mx-1.5">|</span>
                        {apt.day?.name} {apt.hour?.time}
                      </>
                    )}
                  </p>
                </button>
              </li>
            ))}
          </ul>

          {/* Desktop: full table */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line bg-paper text-muted">
                  {["الرقم", "الاسم الكامل", "الجنس", "تاريخ الميلاد", "الهاتف", "الموقع", "التخصص", "الموعد", "النتيجة"].map((h) => (
                    <th key={h} className="px-4 py-2.5 text-start font-semibold whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {appointments.map((apt) => (
                  <tr key={apt.id} onClick={() => setSelected(apt)} className="cursor-pointer hover:bg-ink-faint">
                    <td className="px-4 py-2.5 font-semibold text-ink">{apt.id}</td>
                    <td className="px-4 py-2.5 font-semibold text-ink">{apt.full_name}</td>
                    <td className="px-4 py-2.5 text-ink">{sexLabel(apt.sex)}</td>
                    <td className="px-4 py-2.5 text-ink whitespace-nowrap">{formatBirthday(apt.birthday)}</td>
                    <td className="px-4 py-2.5 text-ink whitespace-nowrap" dir="ltr">{apt.phone}</td>
                    <td className="px-4 py-2.5 text-ink">{[apt.city, apt.state].filter(Boolean).join('، ') || '—'}</td>
                    <td className="px-4 py-2.5 text-ink">{apt.event_specialty?.specialty?.name || '—'}</td>
                    <td className="px-4 py-2.5 text-ink whitespace-nowrap">{apt.day?.name} {apt.hour?.time}</td>
                    <td className="px-4 py-2.5"><OutcomeBadge status={apt.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <nav className="mt-4 flex items-center justify-between gap-2" aria-label="الصفحات">
          <Button
            variant="secondary"
            icon={ChevronRight}
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            disabled={currentPage === 1 || loading}
          >
            السابقة
          </Button>
          <span className="text-sm text-muted">
            صفحة <span className="font-semibold text-ink">{currentPage}</span> من {totalPages}
          </span>
          <Button
            variant="secondary"
            onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages || loading}
          >
            التالية
            <ChevronLeft className="w-4 h-4" />
          </Button>
        </nav>
      )}

      {/* More filters */}
      <Sheet
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        title="تصفية إضافية"
        footer={
          <>
            <Button variant="secondary" className="flex-1" onClick={() => { setSpecialtyFilter(""); setPerPage(50); setCurrentPage(1); }}>
              أعد الضبط
            </Button>
            <Button className="flex-1" onClick={() => setFiltersOpen(false)}>اعرض النتائج</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="التخصص">
            <SelectInput
              value={specialtyFilter}
              onChange={(e) => { setSpecialtyFilter(e.target.value); setCurrentPage(1); }}
            >
              <option value="">كل التخصصات</option>
              {specialties.map((sp) => (
                <option key={sp.id} value={sp.id}>{sp.name}</option>
              ))}
            </SelectInput>
          </Field>
          <div>
            <span className="block mb-1.5 text-sm font-semibold text-ink">عدد المواعيد في الصفحة</span>
            <ChipGroup
              label="عدد المواعيد في الصفحة"
              value={String(perPage)}
              onChange={(value) => { setPerPage(Number(value)); setCurrentPage(1); }}
              options={[{ value: "25", label: "25" }, { value: "50", label: "50" }, { value: "100", label: "100" }]}
            />
          </div>
        </div>
      </Sheet>

      {/* Appointment details */}
      <Sheet open={!!selected} onClose={() => setSelected(null)} title={selected ? selected.full_name : ""}>
        {selected && (
          <>
            <div className="mb-2"><OutcomeBadge status={selected.status} /></div>
            <dl className="divide-y divide-line">
              <Detail label="رقم الموعد">#{selected.id}</Detail>
              <Detail label="الجنس">{sexLabel(selected.sex)}</Detail>
              <Detail label="تاريخ الميلاد">{formatBirthday(selected.birthday)}</Detail>
              <Detail label="الهاتف">
                {selected.phone && <a href={`tel:${selected.phone}`} dir="ltr" className="underline underline-offset-4">{selected.phone}</a>}
              </Detail>
              <Detail label="المدينة">{selected.city}</Detail>
              <Detail label="الولاية">{selected.state}</Detail>
              <Detail label="التخصص">{selected.event_specialty?.specialty?.name}</Detail>
              {selected.doctor?.name && <Detail label="الطبيب">{selected.doctor.name}</Detail>}
              <Detail label="اليوم">{selected.day?.name || selected.day?.day_date}</Detail>
              <Detail label="الساعة">{selected.hour?.time}</Detail>
            </dl>
          </>
        )}
      </Sheet>
    </div>
  );
};

export default PatientsList;
