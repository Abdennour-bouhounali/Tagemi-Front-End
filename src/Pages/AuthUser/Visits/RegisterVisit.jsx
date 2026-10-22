import { API_BASE_URL } from '../../../config/environment';
import React, { useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import {
  CheckCircle2, AlertTriangle, CalendarDays, Clock, MapPin, Plus, Trash2, ChevronRight, ChevronLeft,
  Upload, FileText, X, Printer, Download, Info, Ticket as TicketIcon, Check,
} from 'lucide-react';
import { writePrintDocument, escapeHtml } from '../../../utils/safeHtml';
import logo from './tagemi_logo.png';
import { AppContext } from '../../../Context/AppContext';
import algeriaLocations from '../../../data/algeria_locations.json';
import {
  Button, IconButton, Field, TextInput, SelectInput, EmptyState, LoadingState, ToastProvider, useToast, cx,
} from '../../../Components/ui';

const apiUrl = API_BASE_URL;

const STEPS = ['بياناتك', 'التخصصات والمواعيد', 'الموافقة والتأكيد'];
const MAX_DOCUMENTS = 5;
const MAX_FILE_BYTES = 10 * 1024 * 1024;

const TAWAT_CITIES = [
  { value: 'tajnint', label: 'تاجنينت' },
  { value: 'bonora', label: 'آت بونور' },
  { value: 'taghardait', label: 'تغردايت' },
  { value: 'mlichat', label: 'آت مليشت' },
  { value: 'yazgan', label: 'آت يزجن' },
  { value: 'berian', label: 'آت برقان' },
  { value: 'karara', label: 'القرارة' },
  { value: 'warglen', label: 'وارجلان' },
];
const CITY_NAMES = Object.fromEntries(TAWAT_CITIES.map((c) => [c.value, c.label]));

const REQUIRED_MESSAGES = {
  name: 'اكتب اسمك.',
  lastName: 'اكتب لقبك.',
  birthday: 'اكتب تاريخ ميلادك كاملاً: اليوم والشهر والسنة.',
  state: 'اختر ولاية الإقامة.',
  city: 'اختر البلدية.',
  phone: 'اكتب رقم الهاتف الأساسي.',
  phone2: 'اكتب رقماً ثانياً، لك أو لأحد أفراد عائلتك.',
  sex: 'اختر الجنس.',
};
const PERSONAL_FIELDS = Object.keys(REQUIRED_MESSAGES);

const EMPTY_SPECIALTY = { event_specialty_id: '', day_id: '', hour_id: '' };
const EMPTY_FORM = {
  name: '',
  lastName: '',
  birthday: '',
  state: '',
  city: '',
  diseases: '',
  phone: '',
  phone2: '',
  sex: '',
  specialties: [EMPTY_SPECIALTY],
};

const formatDay = (dateStr, withYear = false) =>
  new Date(dateStr).toLocaleDateString('ar-DZ', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    ...(withYear ? { year: 'numeric' } : {}),
  });

const placesLeft = (n) => {
  if (n === 1) return 'بقي مكان واحد';
  if (n === 2) return 'بقي مكانان';
  if (n >= 3 && n <= 10) return `بقيت ${n} أماكن`;
  return `بقي ${n} مكاناً`;
};

// ==================== SMALL PARTS ====================

/** Numbered steps (a real sequence). */
function StepIndicator({ current }) {
  return (
    <ol className="flex gap-2 mb-5" aria-label="خطوات الحجز">
      {STEPS.map((label, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <li key={label} className="flex-1 min-w-0" aria-current={active ? 'step' : undefined}>
            <div className="flex items-center gap-2">
              <span
                className={cx(
                  'shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-display text-sm',
                  done || active ? 'bg-ink text-white' : 'bg-white border border-line text-muted'
                )}
              >
                {done ? <Check className="w-4 h-4" /> : i + 1}
              </span>
              {i < STEPS.length - 1 && <span className={cx('flex-1 h-0.5 rounded-full', done ? 'bg-ink' : 'bg-line')} />}
            </div>
            <p className={cx('mt-1.5 text-xs leading-snug', active ? 'font-semibold text-ink' : 'text-muted')}>{label}</p>
          </li>
        );
      })}
    </ol>
  );
}

/** Group of large tappable options (radio behaviour). */
function OptionButton({ selected, disabled, onClick, children, className }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={!!selected}
      disabled={disabled}
      onClick={onClick}
      className={cx(
        'min-h-[3.5rem] rounded-xl border px-3 py-2 text-start transition-colors disabled:cursor-not-allowed',
        selected ? 'bg-ink text-white border-ink' : 'bg-white text-ink border-line hover:bg-ink-faint',
        disabled && 'bg-paper text-muted hover:bg-paper',
        className
      )}
    >
      {children}
    </button>
  );
}

function FieldError({ children }) {
  if (!children) return null;
  return <p className="mt-1.5 text-sm text-red-700">{children}</p>;
}

/** Day / month / year as three numeric boxes: easier than a calendar on a phone. */
function BirthdayFields({ parts, onChange, error }) {
  const box = (key, label, placeholder, maxLength) => (
    <label className="flex-1 min-w-0">
      <span className="block mb-1 text-xs text-muted">{label}</span>
      <input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        autoComplete="off"
        maxLength={maxLength}
        value={parts[key]}
        placeholder={placeholder}
        onChange={(e) => onChange({ ...parts, [key]: e.target.value.replace(/\D/g, '').slice(0, maxLength) })}
        className={cx(
          'w-full h-14 rounded-xl border bg-white px-2 text-center text-xl text-ink placeholder:text-line focus:border-ink focus:outline-none',
          error ? 'border-red-400' : 'border-line'
        )}
        dir="ltr"
      />
    </label>
  );
  return (
    <div className="flex gap-2">
      {box('day', 'اليوم', '15', 2)}
      {box('month', 'الشهر', '06', 2)}
      {box('year', 'السنة', '1960', 4)}
    </div>
  );
}

/** Medical documents (optional), up to 5 files of 10MB. */
function FileUploadField({ files, onChange, error }) {
  const toast = useToast();

  const handleFileChange = (e) => {
    const selected = Array.from(e.target.files || []);
    e.target.value = '';
    const valid = selected.filter((file) => {
      if (file.size > MAX_FILE_BYTES) {
        toast(`الملف ${file.name} أكبر من 10MB، اختر ملفاً أصغر.`, 'error');
        return false;
      }
      return true;
    });
    const merged = [...files, ...valid];
    if (merged.length > MAX_DOCUMENTS) {
      toast(`يمكنك إرفاق ${MAX_DOCUMENTS} ملفات على الأكثر.`, 'error');
    }
    onChange(merged.slice(0, MAX_DOCUMENTS));
  };

  const removeFile = (index) => onChange(files.filter((_, i) => i !== index));

  return (
    <div>
      <p className="font-semibold text-ink">المستندات الطبية (اختياري)</p>
      <p className="mt-1 mb-3 text-sm text-muted">
        تقارير أو تحاليل أو صور أشعة تساعد الطبيب على فهم حالتك. لا تؤثر على حجزك.
      </p>

      {files.length < MAX_DOCUMENTS && (
        <>
          <input
            type="file"
            multiple
            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
            onChange={handleFileChange}
            className="sr-only"
            id="medical-documents-upload"
          />
          <label
            htmlFor="medical-documents-upload"
            className="flex items-center justify-center gap-2 min-h-[3.5rem] rounded-xl border-2 border-dashed border-line bg-white px-4 text-base font-semibold text-ink cursor-pointer hover:bg-ink-faint"
          >
            <Upload className="w-5 h-5" />
            أرفق ملفاً
          </label>
          <p className="mt-1 text-xs text-muted">PDF أو صورة أو Word، حتى 10MB للملف، و{MAX_DOCUMENTS} ملفات على الأكثر.</p>
        </>
      )}

      {files.length > 0 && (
        <ul className="mt-3 space-y-2">
          {files.map((file, index) => (
            <li key={`${file.name}-${index}`} className="flex items-center gap-2 rounded-xl border border-line bg-white ps-3">
              <FileText className="w-5 h-5 shrink-0 text-ink-soft" />
              <div className="min-w-0 flex-1 py-2">
                <p className="text-sm font-semibold text-ink truncate" dir="auto">{file.name}</p>
                <p className="text-xs text-muted">{(file.size / 1024).toFixed(0)} KB</p>
              </div>
              <IconButton icon={X} label={`حذف ${file.name}`} onClick={() => removeFile(index)} />
            </li>
          ))}
        </ul>
      )}
      <FieldError>{error}</FieldError>
    </div>
  );
}

/** One booked specialty: specialty, then day, then hour, each as large options. */
function SpecialtyCard({ specialty, index, event, slots, slotsLoading, onChange, onRemove, canRemove, allSpecialties, error }) {
  const eventSpecialties = event?.event_specialties || [];
  const availableSpecialties = eventSpecialties.filter((es) => !es.is_saturated);

  // Hide specialties already chosen in another card
  const choosable = eventSpecialties.filter(
    (es) => es.id == specialty.event_specialty_id || !allSpecialties.some((s, idx) => idx !== index && s.event_specialty_id == es.id)
  );

  const selectedSpecialty = availableSpecialties.find((es) => es.id == specialty.event_specialty_id);
  const hasOnlyOneDay = selectedSpecialty?.days?.length === 1;
  const isComplete = specialty.event_specialty_id && specialty.day_id && specialty.hour_id;

  const noSlotsMessage = hasOnlyOneDay
    ? 'عذراً، جميع المواعيد المتاحة لهذا التخصص محجوزة. يرجى اختيار تخصص آخر أو التواصل مع المنظمين.'
    : 'عذراً، لا توجد مواعيد متاحة لهذا اليوم. يرجى اختيار يوم آخر.';

  return (
    <section className={cx('bg-white border rounded-2xl p-4', error ? 'border-red-300' : 'border-line')} aria-label={`التخصص ${index + 1}`}>
      <header className="flex items-center justify-between gap-2 mb-3">
        <h3 className="font-display text-lg text-ink">
          {allSpecialties.length > 1 ? `التخصص ${index + 1}` : 'التخصص'}
        </h3>
        {canRemove && <IconButton icon={Trash2} label={`احذف التخصص ${index + 1}`} className="text-red-700 -me-2" onClick={onRemove} />}
      </header>

      {/* 1. Specialty */}
      {!selectedSpecialty ? (
        choosable.filter((es) => !es.is_saturated).length === 0 ? (
          <p className="rounded-xl bg-st-pushed-bg px-3 py-2 text-sm text-st-pushed">
            عذراً، جميع التخصصات المتاحة تم اختيارها بالفعل أو مكتملة حالياً.
          </p>
        ) : (
          <div role="radiogroup" aria-label="اختر التخصص" className="grid gap-2">
            {choosable.map((es) => (
              <OptionButton
                key={es.id}
                disabled={es.is_saturated}
                onClick={() => onChange(index, 'event_specialty_id', String(es.id))}
                className="flex items-center justify-between gap-2"
              >
                <span className="text-base font-semibold">{es.specialty?.name}</span>
                {es.is_saturated ? (
                  <span className="shrink-0 text-xs text-muted">مكتمل</span>
                ) : (
                  <ChevronLeft className="w-5 h-5 shrink-0 text-muted" />
                )}
              </OptionButton>
            ))}
          </div>
        )
      ) : (
        <>
          <div className="flex items-center justify-between gap-2 rounded-xl bg-ink-faint ps-3">
            <p className="py-3 text-base font-semibold text-ink">{selectedSpecialty.specialty?.name}</p>
            <Button variant="ghost" size="sm" className="h-11" onClick={() => onChange(index, 'event_specialty_id', '')}>
              غيّر
            </Button>
          </div>

          {selectedSpecialty.description && (
            <div className="mt-3 flex items-start gap-2 rounded-xl border border-line bg-paper p-3">
              <Info className="w-5 h-5 shrink-0 mt-0.5 text-ink-soft" />
              <div>
                <p className="text-sm font-semibold text-ink">معلومات مهمة عن هذا التخصص</p>
                <p className="mt-1 text-sm text-ink leading-relaxed whitespace-pre-line">{selectedSpecialty.description}</p>
              </div>
            </div>
          )}

          {/* 2. Day */}
          <fieldset className="mt-4">
            <legend className="mb-2 text-sm font-semibold text-ink">اليوم</legend>
            {hasOnlyOneDay && specialty.day_id && (
              <p className="mb-2 text-xs text-muted">يوم واحد متاح لهذا التخصص، اخترناه لك.</p>
            )}
            <div role="radiogroup" aria-label="اختر اليوم" className="grid gap-2 sm:grid-cols-2">
              {(selectedSpecialty.days || []).map((day) => (
                <OptionButton
                  key={day.id}
                  selected={specialty.day_id == day.id}
                  onClick={() => onChange(index, 'day_id', day.id)}
                  className="flex items-center gap-2"
                >
                  <CalendarDays className="w-5 h-5 shrink-0" />
                  <span className="text-base font-semibold">{formatDay(day.day_date, true)}</span>
                </OptionButton>
              ))}
            </div>
          </fieldset>

          {/* 3. Hour */}
          {specialty.day_id && (
            <fieldset className="mt-4">
              <legend className="mb-2 text-sm font-semibold text-ink">الساعة</legend>
              {slotsLoading ? (
                <LoadingState label="جاري تحميل الساعات المتاحة..." />
              ) : slots?.length > 0 ? (
                <>
                  {slots.length === 1 && specialty.hour_id && (
                    <p className="mb-2 text-xs text-muted">ساعة واحدة متاحة، اخترناها لك.</p>
                  )}
                  <div role="radiogroup" aria-label="اختر الساعة" className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {slots.map((slot) => {
                      const selected = specialty.hour_id == slot.hour_id;
                      return (
                        <OptionButton
                          key={slot.hour_id}
                          selected={selected}
                          onClick={() => onChange(index, 'hour_id', slot.hour_id)}
                          className="text-center"
                        >
                          <span className="block font-display text-xl leading-tight" dir="ltr">{slot.time.substring(0, 5)}</span>
                          <span className={cx('block text-xs mt-0.5', selected ? 'text-white/80' : 'text-muted')}>
                            {placesLeft(slot.remaining_slots)}
                          </span>
                        </OptionButton>
                      );
                    })}
                  </div>
                </>
              ) : (
                <p className="rounded-xl bg-st-pushed-bg px-3 py-2 text-sm text-st-pushed">{noSlotsMessage}</p>
              )}
            </fieldset>
          )}

          {isComplete && (
            <p className="mt-4 flex items-center gap-2 text-sm font-semibold text-st-queue">
              <CheckCircle2 className="w-5 h-5" />
              تم اختيار الموعد
            </p>
          )}
        </>
      )}
      <FieldError>{error}</FieldError>
    </section>
  );
}

// ==================== CONFIRMATION ====================

function Confirmation({ eventID, event, formData, appointments, patientId, documentsCount, waitingMessage, onNewBooking }) {
  const toast = useToast();
  const fullName = `${formData.name} ${formData.lastName}`;
  const qrValue = `patient_id:${patientId}`;

  // Saves the QR code with the patient number under it as a PNG
  const downloadQRCode = () => {
    const svg = document.getElementById('patient-qr-code');
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      canvas.width = 360;
      canvas.height = 430;
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 20, 20, 320, 320);
      ctx.fillStyle = '#101E58';
      ctx.textAlign = 'center';
      ctx.direction = 'rtl';
      ctx.font = 'bold 40px Tahoma, sans-serif';
      ctx.fillText(String(patientId), 180, 390);
      ctx.font = '18px Tahoma, sans-serif';
      ctx.fillText('رقم المريض', 180, 352);

      const downloadLink = document.createElement('a');
      downloadLink.download = `QR_Patient_${patientId}_${formData.name}_${formData.lastName}.png`;
      downloadLink.href = canvas.toDataURL('image/png');
      downloadLink.click();
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  // Printable confirmation (popup, scripts blocked, every value escaped)
  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast('لم تُفتح نافذة الطباعة. اسمح بالنوافذ المنبثقة في المتصفح ثم اضغط «اطبع» مرة أخرى.', 'error');
      return;
    }
    const eventName = event?.name || 'الحدث';
    const date = new Date().toLocaleDateString('ar-SA');
    const logoUrl = `${window.location.origin}/tagemi_logo.png`;
    const birthday = formData.birthday ? new Date(formData.birthday).toLocaleDateString('en-GB') : '-';
    const gender = formData.sex === '0' ? 'ذكر' : 'أنثى';
    const diseases = formData.diseases && formData.diseases !== 'nothing' ? formData.diseases : 'لا يوجد';
    const svg = document.getElementById('patient-qr-code');
    const qrCodeBase64 = svg
      ? 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(new XMLSerializer().serializeToString(svg))))
      : '';
    const e = escapeHtml;

    writePrintDocument(printWindow, `
      <!DOCTYPE html>
      <html dir="rtl">
      <head>
        <meta charset="UTF-8">
        <title>تأكيد الحجز - ${e(fullName)}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          @page { size: A4 portrait; margin: 15mm; }
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; direction: rtl; line-height: 1.5; color: #101E58; font-size: 12px; }
          .header { text-align: center; margin-bottom: 14px; padding-bottom: 10px; border-bottom: 2px solid #101E58; }
          .logo { height: 56px; max-width: 150px; margin: 0 auto 8px; display: block; }
          .header h1 { font-size: 20px; margin-bottom: 4px; }
          .event-name { font-size: 15px; font-weight: bold; }
          .date { color: #5E6987; font-size: 11px; }
          .patient-number { text-align: center; margin: 10px 0 14px; }
          .patient-number .label { font-size: 13px; color: #5E6987; }
          .patient-number .value { font-size: 44px; font-weight: bold; letter-spacing: 1px; }
          .note { border: 1px solid #DCE1EC; background: #F2F4F9; padding: 8px; border-radius: 6px; text-align: center; font-weight: bold; margin-bottom: 12px; }
          .qr { text-align: center; margin-bottom: 14px; }
          .qr img { width: 180px; height: 180px; }
          .qr p { font-size: 11px; color: #5E6987; margin-top: 4px; }
          .section { margin-bottom: 12px; padding: 10px; border-radius: 6px; border: 1px solid #DCE1EC; }
          .section-title { font-size: 14px; font-weight: bold; margin-bottom: 8px; }
          .row { display: flex; justify-content: space-between; gap: 12px; padding: 4px 0; border-bottom: 1px solid #F2F4F9; }
          .row:last-child { border-bottom: none; }
          .k { color: #5E6987; }
          .v { font-weight: 600; }
          .apt { padding: 8px 0; border-bottom: 1px dashed #DCE1EC; }
          .apt:last-child { border-bottom: none; }
          .footer { margin-top: 14px; text-align: center; color: #5E6987; font-size: 10px; }
        </style>
      </head>
      <body>
        <div class="header">
          <img src="${e(logoUrl)}" alt="" class="logo" />
          <h1>تم حجز موعدك</h1>
          <div class="event-name">${e(eventName)}</div>
          <div class="date">تاريخ الطباعة: ${e(date)}</div>
        </div>

        <div class="patient-number">
          <div class="label">رقم المريض</div>
          <div class="value">${e(patientId)}</div>
        </div>

        <div class="note">احتفظ بهذه الورقة وأحضرها يوم الفحص</div>

        ${qrCodeBase64 ? `
        <div class="qr">
          <img src="${e(qrCodeBase64)}" alt="QR" />
          <p>اعرض هذا الرمز في الاستقبال لتسجيل حضورك بسرعة</p>
        </div>` : ''}

        <div class="section">
          <div class="section-title">مواعيدك (${e(appointments.length)})</div>
          ${appointments.map((apt) => `
            <div class="apt">
              <div class="row"><span class="k">التخصص</span><span class="v">${e(apt.specialty)}</span></div>
              <div class="row"><span class="k">التاريخ</span><span class="v">${e(apt.date)}</span></div>
              <div class="row"><span class="k">الساعة</span><span class="v">${e(apt.time)}</span></div>
            </div>
          `).join('')}
        </div>

        <div class="section">
          <div class="section-title">معلومات المريض</div>
          <div class="row"><span class="k">الاسم</span><span class="v">${e(fullName)}</span></div>
          <div class="row"><span class="k">تاريخ الميلاد</span><span class="v">${e(birthday)}</span></div>
          <div class="row"><span class="k">الجنس</span><span class="v">${e(gender)}</span></div>
          <div class="row"><span class="k">الهاتف</span><span class="v">${e(formData.phone)}</span></div>
          <div class="row"><span class="k">هاتف ثان</span><span class="v">${e(formData.phone2)}</span></div>
          <div class="row"><span class="k">العنوان</span><span class="v">${e(formData.state)} - ${e(CITY_NAMES[formData.city] || formData.city)}</span></div>
          <div class="row"><span class="k">الأمراض المزمنة</span><span class="v">${e(diseases)}</span></div>
          ${documentsCount > 0 ? `<div class="row"><span class="k">المستندات الطبية</span><span class="v">${e(documentsCount)} ملف</span></div>` : ''}
        </div>

        <div class="footer">
          <p>صدر في ${e(new Date().toLocaleString('ar-DZ'))}، مؤسسة تجمي © ${e(new Date().getFullYear())}</p>
        </div>
      </body>
      </html>
    `);

    printWindow.focus();
    setTimeout(() => printWindow.print(), 250);
  };

  return (
    <div className="max-w-md mx-auto px-4 pt-6 pb-10">
      <div className="text-center">
        <CheckCircle2 className="w-12 h-12 mx-auto text-st-queue" />
        <h1 className="mt-2 font-display text-2xl text-ink">تم حجز موعدك</h1>
        <p className="mt-1 text-sm text-muted">{event?.name}</p>
      </div>

      {/* The ticket */}
      <article className="mt-5 bg-white border border-line rounded-2xl overflow-hidden">
        <div className="px-5 pt-5 pb-4 text-center">
          <p className="text-sm text-muted">رقم المريض</p>
          <p className="font-display text-6xl text-ink leading-tight" dir="ltr">{patientId}</p>
          <p className="mt-1 text-base font-semibold text-ink">{fullName}</p>
        </div>
        <div className="relative border-t-2 border-dashed border-line" aria-hidden="true">
          <span className="absolute -top-[9px] -start-[9px] w-4 h-4 rounded-full bg-paper border border-line" />
          <span className="absolute -top-[9px] -end-[9px] w-4 h-4 rounded-full bg-paper border border-line" />
        </div>
        {patientId && (
          <div className="px-5 py-5 flex flex-col items-center">
            <QRCodeSVG id="patient-qr-code" value={qrValue} size={200} level="H" includeMargin />
            <p className="mt-2 text-sm text-muted text-center">اعرض هذا الرمز في الاستقبال لتسجيل حضورك بسرعة</p>
          </div>
        )}
        <div className="border-t border-line px-5 py-4">
          <ul className="space-y-3">
            {appointments.map((apt, index) => (
              <li key={index}>
                <p className="font-semibold text-ink">{apt.specialty}</p>
                <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
                  <span className="inline-flex items-center gap-1"><CalendarDays className="w-4 h-4" />{apt.date}</span>
                  <span className="inline-flex items-center gap-1"><Clock className="w-4 h-4" /><span dir="ltr">{apt.time}</span></span>
                </p>
              </li>
            ))}
          </ul>
          {documentsCount > 0 && (
            <p className="mt-3 flex items-center gap-2 text-sm text-ink">
              <FileText className="w-4 h-4 text-ink-soft" />
              أرفقت {documentsCount} {documentsCount === 1 ? 'مستنداً طبياً' : 'مستندات طبية'}
            </p>
          )}
        </div>
      </article>

      {waitingMessage && (
        <p className="mt-4 flex items-start gap-2 rounded-xl bg-st-pushed-bg px-3 py-3 text-sm text-st-pushed">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <span>{waitingMessage}</span>
        </p>
      )}

      <div className="mt-4 grid grid-cols-2 gap-2">
        <Button size="lg" icon={Download} onClick={downloadQRCode}>احفظ الصورة</Button>
        <Button size="lg" variant="secondary" icon={Printer} onClick={handlePrint}>اطبع</Button>
      </div>
      <p className="mt-2 text-xs text-muted text-center">احفظ الصورة في هاتفك أو التقط لقطة شاشة لهذه الصفحة.</p>

      <section className="mt-6 bg-white border border-line rounded-2xl p-4">
        <h2 className="font-display text-lg text-ink mb-3">ماذا أفعل يوم الزيارة</h2>
        <ol className="space-y-3 text-base text-ink">
          {[
            'احضر قبل موعدك بـ 15 دقيقة.',
            `اذهب إلى الاستقبال واعرض رقم المريض ${patientId} أو رمز QR.`,
            'أحضر معك تقاريرك وتحاليلك السابقة إن وُجدت.',
            'انتظر في القاعة وتابع دورك على الشاشة أو من هاتفك.',
          ].map((text, i) => (
            <li key={i} className="flex items-start gap-3">
              <span className="shrink-0 w-7 h-7 rounded-full bg-ink-faint text-ink font-display text-sm flex items-center justify-center">{i + 1}</span>
              <span className="pt-0.5">{text}</span>
            </li>
          ))}
        </ol>
        <p className="mt-4 text-sm text-muted">
          إن لم تستطع الحضور، أبلغ المنظمين مسبقاً. سنتواصل معك على الرقم <span dir="ltr" className="font-semibold text-ink">{formData.phone}</span>.
        </p>
        <Link
          to={`/my-turn/${eventID}`}
          className="mt-4 flex items-center justify-center gap-2 h-12 rounded-xl border border-line bg-white text-base font-semibold text-ink hover:bg-ink-faint"
        >
          <TicketIcon className="w-5 h-5" />
          اعرف دورك يوم الزيارة
        </Link>
      </section>

      <Button variant="ghost" size="lg" block className="mt-4" onClick={onNewBooking}>
        احجز لشخص آخر
      </Button>
    </div>
  );
}

// ==================== MAIN COMPONENT ====================

const RegisterVisitInner = () => {
  const { eventID } = useParams();
  const { token } = useContext(AppContext);
  const toast = useToast();

  const [currentStep, setCurrentStep] = useState(0);
  const [event, setEvent] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [availableSlots, setAvailableSlots] = useState({});
  const [slotsLoading, setSlotsLoading] = useState({});
  const [acceptedRules, setAcceptedRules] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [specialtyErrors, setSpecialtyErrors] = useState({});
  const [availableCities, setAvailableCities] = useState([]);
  const [medicalDocuments, setMedicalDocuments] = useState([]);
  const [patientId, setPatientId] = useState(null);
  const [waitingMessage, setWaitingMessage] = useState('');
  const [submitNotice, setSubmitNotice] = useState(null); // { text, list? } from a 409
  const [birthdayParts, setBirthdayParts] = useState({ day: '', month: '', year: '' });
  const [formData, setFormData] = useState(EMPTY_FORM);
  const maxAllowedSpecialties = event?.nbr_of_allowed_specialties || 1;

  // Validation rules
  const arabicRegex = /^[ء-ي٠-٩\s]*$/;
  const phoneRegex = /^[0-9+\-\s()]+$/;

  const allSpecialtiesSaturated = useMemo(() => {
    if (!event?.event_specialties) return false;
    return event.event_specialties.filter((es) => !es.is_saturated).length === 0;
  }, [event]);

  const availableSpecialtiesCount = useMemo(() => {
    if (!event?.event_specialties) return 0;
    return event.event_specialties.filter((es) => !es.is_saturated).length;
  }, [event]);

  const isCurrentSpecialtyComplete = useMemo(() => {
    const last = formData.specialties[formData.specialties.length - 1];
    return last?.event_specialty_id && last?.day_id && last?.hour_id;
  }, [formData.specialties]);

  // ==================== API CALLS ====================

  const getEvent = useCallback(async () => {
    setLoading(true);
    try {
      const headers = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch(`${apiUrl}/api/public/events/${eventID}`, { headers });
      if (res.status === 404) {
        setEvent(null);
        setLoadError('الحدث غير موجود');
        return;
      }
      if (!res.ok) throw new Error('Server error');
      const data = await res.json();
      setEvent(data.event);
    } catch (error) {
      console.error('Error fetching event:', error);
      setEvent(null);
      setLoadError('حدث خطأ في تحميل بيانات الحدث');
    } finally {
      setLoading(false);
    }
  }, [eventID, token]);

  const getRules = useCallback(async () => {
    try {
      const eventRes = await fetch(`${apiUrl}/api/public/events/${eventID}`);
      const eventData = await eventRes.json();
      if (eventData.event?.rules_ids && eventData.event.rules_ids.length > 0) {
        const allRulesRes = await fetch(`${apiUrl}/api/rules`);
        const allRulesData = await allRulesRes.json();
        setRules(allRulesData.filter((rule) => eventData.event.rules_ids.includes(rule.id)));
      } else {
        const res = await fetch(`${apiUrl}/api/rules`);
        setRules(await res.json());
      }
    } catch (error) {
      console.error('Error fetching rules:', error);
    }
  }, [eventID]);

  const fetchAvailableSlots = useCallback(async (eventSpecialtyId, dayId, specialtyIndex) => {
    setSlotsLoading((prev) => ({ ...prev, [`${specialtyIndex}`]: true }));
    try {
      const res = await fetch(
        `${apiUrl}/api/appointments/available-slots?event_specialty_id=${eventSpecialtyId}&day_id=${dayId}`
      );
      const data = await res.json();
      setAvailableSlots((prev) => ({ ...prev, [`${specialtyIndex}`]: data.available_slots || [] }));

      // Auto-select hour if only one slot available
      if (data.available_slots?.length === 1) {
        setFormData((prev) => ({
          ...prev,
          specialties: prev.specialties.map((spec, idx) =>
            idx === specialtyIndex ? { ...spec, hour_id: data.available_slots[0].hour_id } : spec
          ),
        }));
      }
    } catch (error) {
      console.error('Error fetching available slots:', error);
      toast('فشل في تحميل المواعيد المتاحة. تحقق من اتصالك ثم اختر اليوم مرة أخرى.', 'error');
    } finally {
      setSlotsLoading((prev) => ({ ...prev, [`${specialtyIndex}`]: false }));
    }
  }, [toast]);

  useEffect(() => {
    getEvent();
    getRules();
  }, [getEvent, getRules]);

  // ==================== FORM HANDLERS ====================

  const handleAddSpecialty = useCallback(() => {
    if (formData.specialties.length < maxAllowedSpecialties && isCurrentSpecialtyComplete) {
      setFormData((prev) => ({ ...prev, specialties: [...prev.specialties, { ...EMPTY_SPECIALTY }] }));
    }
  }, [formData.specialties.length, maxAllowedSpecialties, isCurrentSpecialtyComplete]);

  const handleRemoveSpecialty = useCallback((index) => {
    setFormData((prev) => ({ ...prev, specialties: prev.specialties.filter((_, i) => i !== index) }));
    // Slots are keyed by card index: shift the following cards down by one
    const shift = (prev) => {
      const next = {};
      Object.keys(prev).forEach((key) => {
        const i = Number(key);
        if (i < index) next[key] = prev[key];
        else if (i > index) next[`${i - 1}`] = prev[key];
      });
      return next;
    };
    setAvailableSlots(shift);
    setSlotsLoading(shift);
    setSpecialtyErrors({});
  }, []);

  const handleSpecialtyChange = useCallback((index, field, value) => {
    const updatedSpecialties = formData.specialties.map((specialty, i) => {
      if (index !== i) return specialty;
      const updated = { ...specialty, [field]: value };

      if (field === 'event_specialty_id') {
        updated.day_id = '';
        updated.hour_id = '';
        setAvailableSlots((prev) => ({ ...prev, [`${index}`]: [] }));

        // Auto-select day if only one option available
        const selectedEventSpecialty = event?.event_specialties?.find((es) => es.id == value);
        if (selectedEventSpecialty?.days?.length === 1) {
          const onlyDay = selectedEventSpecialty.days[0];
          updated.day_id = onlyDay.id;
          fetchAvailableSlots(value, onlyDay.id, index);
        }
      } else if (field === 'day_id') {
        updated.hour_id = '';
        if (specialty.event_specialty_id && value) {
          fetchAvailableSlots(specialty.event_specialty_id, value, index);
        }
      }
      return updated;
    });

    setFormData((prev) => ({ ...prev, specialties: updatedSpecialties }));
    setSpecialtyErrors((prev) => ({ ...prev, [index]: '' }));
  }, [formData.specialties, fetchAvailableSlots, event]);

  const validateField = useCallback((name, value) => {
    let error = '';
    switch (name) {
      case 'name':
      case 'lastName':
        if (!arabicRegex.test(value)) {
          error = 'يرجى إدخال أحرف عربية فقط';
        } else if (value.length < 2) {
          error = 'يجب أن يكون الاسم حرفين على الأقل';
        }
        break;
      case 'phone':
      case 'phone2':
        if (!phoneRegex.test(value)) {
          error = 'رقم الهاتف غير صحيح، اكتب الأرقام فقط';
        } else if (value.length < 9) {
          error = 'رقم الهاتف قصير جداً';
        }
        break;
      case 'birthday': {
        const birthDate = new Date(value);
        const today = new Date();
        const age = today.getFullYear() - birthDate.getFullYear();
        if (age < 0 || age > 120) {
          error = 'تاريخ الميلاد غير صحيح';
        }
        break;
      }
      default:
        break;
    }
    setFieldErrors((prev) => ({ ...prev, [name]: error }));
    return !error;
  }, [arabicRegex, phoneRegex]);

  const handleChangeData = useCallback((e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    validateField(name, value);
  }, [validateField]);

  const setSex = (value) => {
    setFormData((prev) => ({ ...prev, sex: value }));
    setFieldErrors((prev) => ({ ...prev, sex: '' }));
  };

  // Builds YYYY-MM-DD once day, month and a 4-digit year are typed
  const handleBirthdayParts = (parts) => {
    setBirthdayParts(parts);
    const { day, month, year } = parts;
    if (!day || !month || year.length < 4) {
      setFormData((prev) => ({ ...prev, birthday: '' }));
      setFieldErrors((prev) => ({ ...prev, birthday: '' }));
      return;
    }
    const d = Number(day);
    const m = Number(month);
    const y = Number(year);
    const date = new Date(y, m - 1, d);
    const real = date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d;
    if (!real || date >= new Date()) {
      setFormData((prev) => ({ ...prev, birthday: '' }));
      setFieldErrors((prev) => ({ ...prev, birthday: 'تاريخ الميلاد غير صحيح، تأكد من اليوم والشهر والسنة.' }));
      return;
    }
    const birthday = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    setFormData((prev) => ({ ...prev, birthday }));
    validateField('birthday', birthday);
  };

  const age = useMemo(() => {
    if (!formData.birthday) return null;
    const b = new Date(formData.birthday);
    const now = new Date();
    let years = now.getFullYear() - b.getFullYear();
    if (now.getMonth() < b.getMonth() || (now.getMonth() === b.getMonth() && now.getDate() < b.getDate())) years -= 1;
    return years;
  }, [formData.birthday]);

  const handleStateChange = useCallback((e) => {
    const stateName = e.target.value;
    setFormData((prev) => ({ ...prev, state: stateName, city: '' }));
    setFieldErrors((prev) => ({ ...prev, state: '', city: '' }));
    const selectedWilaya = algeriaLocations.algeria_locations.find((loc) => loc.name_ar === stateName);
    setAvailableCities(selectedWilaya ? selectedWilaya.communes : []);
  }, []);

  const handleFileChange = useCallback((files) => {
    setMedicalDocuments(files);
    if (files.length > 0) setFieldErrors((prev) => ({ ...prev, medical_documents: '' }));
  }, []);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });
  const scrollToId = (id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'center' });

  const handleNextStep = useCallback(() => {
    if (currentStep === 0) {
      const errs = {};
      PERSONAL_FIELDS.forEach((f) => {
        if (!formData[f]) errs[f] = fieldErrors[f] || REQUIRED_MESSAGES[f];
      });
      // Format errors already shown under fields also block the step
      PERSONAL_FIELDS.forEach((f) => {
        if (fieldErrors[f]) errs[f] = fieldErrors[f];
      });
      const bad = PERSONAL_FIELDS.filter((f) => errs[f]);
      if (bad.length) {
        setFieldErrors((prev) => ({ ...prev, ...errs }));
        toast('يرجى إكمال جميع الحقول المطلوبة قبل المتابعة', 'error');
        scrollToId(`f-${bad[0]}`);
        return;
      }
    }
    if (currentStep === 1) {
      const errs = {};
      formData.specialties.forEach((s, i) => {
        if (!s.event_specialty_id) errs[i] = 'اختر التخصص.';
        else if (!s.day_id) errs[i] = 'اختر اليوم.';
        else if (!s.hour_id) errs[i] = 'اختر الساعة.';
      });
      const bad = Object.keys(errs);
      if (bad.length) {
        setSpecialtyErrors(errs);
        toast('أكمل اختيار التخصص واليوم والساعة قبل المتابعة.', 'error');
        scrollToId(`spec-${bad[0]}`);
        return;
      }
    }
    setCurrentStep((prev) => prev + 1);
    scrollToTop();
  }, [currentStep, formData, fieldErrors, toast]);

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(0, prev - 1));
    setSubmitNotice(null);
    scrollToTop();
  };

  // ==================== FORM SUBMISSION ====================

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (currentStep < STEPS.length - 1) {
      handleNextStep();
      return;
    }
    if (!acceptedRules) {
      toast('يجب الموافقة على الشروط والأحكام', 'error');
      return;
    }

    const eventId = event?.id;
    if (!eventId) {
      toast('خطأ: لم يتم العثور على معرف الحدث', 'error');
      return;
    }

    setIsSubmitting(true);
    setSubmitNotice(null);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('name', formData.name);
      formDataToSend.append('lastName', formData.lastName);
      formDataToSend.append('birthday', formData.birthday);
      formDataToSend.append('state', formData.state);
      formDataToSend.append('city', formData.city);
      formDataToSend.append('diseases', formData.diseases || '');
      formDataToSend.append('phone', formData.phone);
      formDataToSend.append('phone2', formData.phone2);
      formDataToSend.append('sex', formData.sex);

      formData.specialties.forEach((specialty, index) => {
        formDataToSend.append(`specialties[${index}][event_specialty_id]`, specialty.event_specialty_id);
        formDataToSend.append(`specialties[${index}][day_id]`, specialty.day_id);
        formDataToSend.append(`specialties[${index}][hour_id]`, specialty.hour_id);
      });

      medicalDocuments.slice(0, MAX_DOCUMENTS).forEach((file, index) => {
        formDataToSend.append(`medical_documents[${index}]`, file);
      });

      const headers = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`${apiUrl}/api/appointment/${eventId}`, {
        method: 'POST',
        headers,
        body: formDataToSend,
      });

      if (!res.ok) {
        let errorData = {};
        try {
          errorData = await res.json();
        } catch {
          errorData = {};
        }
        if (res.status === 409) {
          // Already booked in this event, or every chosen hour filled up meanwhile
          setSubmitNotice({
            text: errorData.message || 'تعذّر الحجز.',
            list: errorData.waiting_list_specialties || [],
          });
        }
        if (res.status === 422 && errorData.errors) {
          const serverErrors = {};
          Object.entries(errorData.errors).forEach(([key, msgs]) => {
            if (PERSONAL_FIELDS.includes(key)) serverErrors[key] = Array.isArray(msgs) ? msgs[0] : msgs;
          });
          if (Object.keys(serverErrors).length) {
            setFieldErrors((prev) => ({ ...prev, ...serverErrors }));
            setCurrentStep(0);
          }
        }
        if (res.status === 429) {
          throw new Error('محاولات كثيرة، انتظر دقيقة ثم اضغط «احجز موعدي» مرة أخرى.');
        }
        throw new Error(errorData.message || 'فشل في إرسال الحجز');
      }

      const data = await res.json();
      if (data.patient_id) setPatientId(data.patient_id);
      setWaitingMessage(data.waiting_message || '');
      setShowConfirmation(true);
      scrollToTop();
    } catch (error) {
      console.error('Submission error:', error);
      toast(error.message || 'حدث خطأ أثناء إرسال الحجز. يرجى المحاولة مرة أخرى.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = useMemo(() => (
    formData.name &&
    formData.lastName &&
    formData.birthday &&
    formData.state &&
    formData.city &&
    formData.phone &&
    formData.phone2 &&
    formData.sex &&
    formData.specialties.every((s) => s.event_specialty_id && s.day_id && s.hour_id) &&
    !Object.values(fieldErrors).some((error) => error) &&
    acceptedRules
  ), [formData, fieldErrors, acceptedRules]);

  const appointmentSummary = useMemo(() => formData.specialties.map((spec, index) => {
    const specialty = event?.event_specialties?.find((es) => es.id == spec.event_specialty_id);
    const day = specialty?.days?.find((d) => d.id == spec.day_id);
    const slot = availableSlots[`${index}`]?.find((s) => s.hour_id == spec.hour_id);
    return {
      specialty: specialty?.specialty?.name || 'غير محدد',
      date: day ? formatDay(day.day_date, true) : 'غير محدد',
      time: slot?.time ? slot.time.substring(0, 5) : 'غير محدد',
    };
  }), [formData.specialties, event, availableSlots]);

  const resetForNewBooking = () => {
    setShowConfirmation(false);
    setPatientId(null);
    setWaitingMessage('');
    setSubmitNotice(null);
    setFormData(EMPTY_FORM);
    setBirthdayParts({ day: '', month: '', year: '' });
    setFieldErrors({});
    setSpecialtyErrors({});
    setAvailableSlots({});
    setMedicalDocuments([]);
    setCurrentStep(0);
    setAcceptedRules(false);
    setAvailableCities([]);
    scrollToTop();
    getEvent(); // fresh saturation flags
  };

  // ==================== EVENT SUMMARY ====================

  const eventDates = useMemo(() => {
    const allDays = event?.event_specialties?.flatMap((es) => es.days?.map((day) => new Date(day.day_date)) || []) || [];
    if (allDays.length === 0) return null;
    const min = new Date(Math.min(...allDays));
    const max = new Date(Math.max(...allDays));
    const opts = { weekday: 'long', month: 'long', day: 'numeric' };
    return min.getTime() === max.getTime()
      ? min.toLocaleDateString('ar-DZ', opts)
      : `من ${min.toLocaleDateString('ar-DZ', opts)} إلى ${max.toLocaleDateString('ar-DZ', opts)}`;
  }, [event]);

  // ==================== STEPS ====================

  const renderPersonalInfo = () => (
    <div className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <div id="f-name">
          <Field label="الاسم" error={fieldErrors.name} hint="بالحروف العربية">
            <TextInput name="name" value={formData.name} onChange={handleChangeData} invalid={!!fieldErrors.name} autoComplete="given-name" />
          </Field>
        </div>
        <div id="f-lastName">
          <Field label="اللقب" error={fieldErrors.lastName} hint="بالحروف العربية">
            <TextInput name="lastName" value={formData.lastName} onChange={handleChangeData} invalid={!!fieldErrors.lastName} autoComplete="family-name" />
          </Field>
        </div>
      </div>

      <fieldset id="f-birthday">
        <legend className="mb-1.5 text-sm font-semibold text-ink">تاريخ الميلاد</legend>
        <BirthdayFields parts={birthdayParts} onChange={handleBirthdayParts} error={fieldErrors.birthday} />
        {fieldErrors.birthday ? (
          <FieldError>{fieldErrors.birthday}</FieldError>
        ) : age !== null ? (
          <p className="mt-1 text-xs text-muted">العمر: {age} سنة</p>
        ) : null}
      </fieldset>

      <fieldset id="f-sex">
        <legend className="mb-1.5 text-sm font-semibold text-ink">الجنس</legend>
        <div role="radiogroup" aria-label="الجنس" className="grid grid-cols-2 gap-2">
          {[{ value: '0', label: 'ذكر' }, { value: '1', label: 'أنثى' }].map((o) => (
            <OptionButton key={o.value} selected={formData.sex === o.value} onClick={() => setSex(o.value)} className="text-center text-base font-semibold">
              {o.label}
            </OptionButton>
          ))}
        </div>
        <FieldError>{fieldErrors.sex}</FieldError>
      </fieldset>

      <div className="grid gap-5 sm:grid-cols-2">
        <div id="f-state">
          <Field label="ولاية الإقامة" error={fieldErrors.state}>
            <SelectInput name="state" value={formData.state} onChange={handleStateChange} className={fieldErrors.state ? 'border-red-400' : ''}>
              <option value="">اختر الولاية</option>
              {algeriaLocations.algeria_locations.map((loc) => (
                <option key={loc.code} value={loc.name_ar}>{`${loc.code} ${loc.name_ar}`}</option>
              ))}
            </SelectInput>
          </Field>
        </div>
        <div id="f-city">
          {event?.is_tawat ? (
            <Field label="القصر" error={fieldErrors.city}>
              <SelectInput name="city" value={formData.city} onChange={handleChangeData} className={fieldErrors.city ? 'border-red-400' : ''}>
                <option value="">اختر القصر</option>
                {TAWAT_CITIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </SelectInput>
            </Field>
          ) : (
            <Field label="البلدية" error={fieldErrors.city}>
              <SelectInput
                name="city"
                value={formData.city}
                onChange={handleChangeData}
                disabled={!formData.state || availableCities.length === 0}
                className={fieldErrors.city ? 'border-red-400' : ''}
              >
                <option value="">{formData.state ? 'اختر البلدية' : 'اختر الولاية أولاً'}</option>
                {availableCities.map((city) => <option key={city} value={city}>{city}</option>)}
              </SelectInput>
            </Field>
          )}
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div id="f-phone">
          <Field label="رقم الهاتف الأساسي (واتساب إن وُجد)" error={fieldErrors.phone}>
            <TextInput
              name="phone" type="tel" inputMode="tel" autoComplete="tel" dir="ltr"
              value={formData.phone} onChange={handleChangeData} invalid={!!fieldErrors.phone}
              placeholder="0555 12 34 56" className="text-start text-lg"
            />
          </Field>
        </div>
        <div id="f-phone2">
          <Field label="رقم هاتف ثانٍ (لك أو لأحد أفراد عائلتك)" error={fieldErrors.phone2}>
            <TextInput
              name="phone2" type="tel" inputMode="tel" dir="ltr"
              value={formData.phone2} onChange={handleChangeData} invalid={!!fieldErrors.phone2}
              className="text-start text-lg"
            />
          </Field>
        </div>
      </div>

      <Field label="الأمراض المزمنة (اختياري)" hint="مثل: السكري، ضغط الدم. اتركه فارغاً إن لم يوجد.">
        <TextInput name="diseases" value={formData.diseases} onChange={handleChangeData} />
      </Field>
    </div>
  );

  const renderSpecialtySelection = () => (
    <div className="space-y-4">
      <p className="text-sm text-muted">
        {maxAllowedSpecialties > 1
          ? `يمكنك حجز ${maxAllowedSpecialties} تخصصات على الأكثر. اختر التخصص ثم اليوم ثم الساعة.`
          : 'اختر التخصص ثم اليوم ثم الساعة.'}
        {availableSpecialtiesCount < (event?.event_specialties?.length || 0) &&
          ` بعض التخصصات مكتملة: متاح ${availableSpecialtiesCount} من ${event?.event_specialties?.length}.`}
      </p>

      {formData.specialties.map((specialty, index) => (
        <div key={index} id={`spec-${index}`}>
          <SpecialtyCard
            specialty={specialty}
            index={index}
            event={event}
            slots={availableSlots[`${index}`]}
            slotsLoading={!!slotsLoading[`${index}`]}
            onChange={handleSpecialtyChange}
            onRemove={() => handleRemoveSpecialty(index)}
            canRemove={formData.specialties.length > 1}
            allSpecialties={formData.specialties}
            error={specialtyErrors[index]}
          />
        </div>
      ))}

      {formData.specialties.length < maxAllowedSpecialties &&
        availableSpecialtiesCount > 1 &&
        availableSpecialtiesCount > formData.specialties.length && (
          isCurrentSpecialtyComplete ? (
            <Button variant="secondary" size="lg" block icon={Plus} onClick={handleAddSpecialty}>
              أضف تخصصاً آخر (يمكنك إضافة {maxAllowedSpecialties - formData.specialties.length})
            </Button>
          ) : (
            <p className="rounded-xl border border-dashed border-line px-4 py-3 text-center text-sm text-muted">
              أكمل اختيار التخصص والموعد الحالي لإضافة تخصص آخر.
            </p>
          )
        )}

      {maxAllowedSpecialties === 1 && formData.specialties[0].event_specialty_id && (
        <div className="bg-white border border-line rounded-2xl p-4">
          <FileUploadField files={medicalDocuments} onChange={handleFileChange} error={fieldErrors.medical_documents} />
        </div>
      )}
    </div>
  );

  const renderRulesAcceptance = () => (
    <div className="space-y-4">
      {/* Summary */}
      <section className="bg-white border border-line rounded-2xl p-4">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-display text-base text-ink">ملخص الحجز</h3>
          <Button variant="ghost" size="sm" className="h-11" onClick={() => { setCurrentStep(0); scrollToTop(); }}>عدّل</Button>
        </div>
        <p className="mt-1 text-base font-semibold text-ink">{formData.name} {formData.lastName}</p>
        <p className="text-sm text-muted">
          {age !== null && `${age} سنة، `}{formData.sex === '1' ? 'أنثى' : 'ذكر'}، <span dir="ltr">{formData.phone}</span>
        </p>
        <ul className="mt-3 space-y-2 border-t border-line pt-3">
          {appointmentSummary.map((apt, i) => (
            <li key={i}>
              <p className="font-semibold text-ink">{apt.specialty}</p>
              <p className="text-sm text-muted">{apt.date}، الساعة <span dir="ltr">{apt.time}</span></p>
            </li>
          ))}
        </ul>
        {medicalDocuments.length > 0 && (
          <p className="mt-2 text-sm text-muted">مستندات مرفقة: {medicalDocuments.length}</p>
        )}
      </section>

      {/* Rules */}
      <section className="bg-white border border-line rounded-2xl p-4">
        <h3 className="font-display text-base text-ink mb-3">الشروط والأحكام</h3>
        {rules.length === 0 ? (
          <p className="text-sm text-muted">جاري تحميل الشروط...</p>
        ) : (
          <ol className="space-y-3">
            {rules.map((rule, index) => (
              <li key={rule.id ?? index} className="flex items-start gap-3">
                <span className="shrink-0 w-6 h-6 rounded-full bg-ink-faint text-ink text-xs font-semibold flex items-center justify-center">{index + 1}</span>
                <p className={cx('text-sm leading-relaxed', rule.id === 6 ? 'text-red-700 font-semibold' : 'text-ink')}>{rule.rule}</p>
              </li>
            ))}
          </ol>
        )}
      </section>

      <label
        className={cx(
          'flex items-center gap-3 min-h-[3.5rem] rounded-2xl border px-4 py-3 cursor-pointer',
          acceptedRules ? 'border-ink bg-ink-faint' : 'border-line bg-white'
        )}
      >
        <input
          type="checkbox"
          checked={acceptedRules}
          onChange={(e) => setAcceptedRules(e.target.checked)}
          className="w-6 h-6 shrink-0 accent-[#101E58]"
        />
        <span className="text-base font-semibold text-ink">أوافق على جميع الشروط والأحكام المذكورة أعلاه</span>
      </label>
      {!acceptedRules && <p className="text-sm text-muted">ضع علامة على الموافقة لتتمكن من الحجز.</p>}

      {submitNotice && (
        <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">
          <p className="flex items-start gap-2 font-semibold">
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
            <span>{submitNotice.text}</span>
          </p>
          {submitNotice.list?.length > 0 && (
            <p className="mt-2 text-sm">التخصصات الممتلئة: {submitNotice.list.join('، ')}. ارجع واختر ساعة أو يوماً آخر.</p>
          )}
          {!submitNotice.list?.length && (
            <Link to={`/my-turn/${eventID}`} className="mt-3 inline-flex items-center min-h-[44px] text-sm font-semibold text-ink underline underline-offset-4">
              اعرف مواعيدك ودورك برقم المريض
            </Link>
          )}
        </div>
      )}
    </div>
  );

  // ==================== MAIN RENDER ====================

  if (loading && !event) return <LoadingState />;

  if (!event || event.is_active == 0) {
    return (
      <div className="max-w-md mx-auto px-4 py-10">
        <div className="bg-white border border-line rounded-2xl">
          <EmptyState icon={AlertTriangle} title={loadError || 'الحدث غير موجود'}>
            عذراً، لا يمكن الحجز في هذا الحدث الآن. تأكد من الرابط أو تواصل مع المنظمين.
          </EmptyState>
        </div>
      </div>
    );
  }

  if (showConfirmation) {
    return (
      <Confirmation
        eventID={eventID}
        event={event}
        formData={formData}
        appointments={appointmentSummary}
        patientId={patientId}
        documentsCount={medicalDocuments.length}
        waitingMessage={waitingMessage}
        onNewBooking={resetForNewBooking}
      />
    );
  }

  if (allSpecialtiesSaturated) {
    return (
      <div className="max-w-md mx-auto px-4 py-10">
        <div className="bg-white border border-line rounded-2xl p-6 text-center">
          <AlertTriangle className="w-10 h-10 mx-auto mb-3 text-st-pushed" />
          <h1 className="font-display text-2xl text-ink mb-2">اكتمل الحجز</h1>
          <p className="text-base text-ink leading-relaxed">
            عذراً، جميع التخصصات في «{event.name}» مكتملة حالياً ولا يمكن قبول حجوزات جديدة.
          </p>
          <p className="mt-2 text-sm text-muted">تواصل مع المنظمين أو تابع الإعلانات عن القوافل القادمة.</p>
          <p className="mt-4 inline-flex items-center gap-1 text-sm text-muted">
            <MapPin className="w-4 h-4" />
            {event.state || 'غير محدد'}، {event.city || '-'}
          </p>
        </div>
      </div>
    );
  }

  const stepContent = [renderPersonalInfo, renderSpecialtySelection, renderRulesAcceptance][currentStep];
  const isLast = currentStep === STEPS.length - 1;

  return (
    <form onSubmit={handleSubmit} noValidate className="max-w-xl mx-auto px-4 pt-5 pb-32">
      {/* Event */}
      <header className="mb-5 flex items-start gap-3">
        <img src={logo} alt="" className="w-14 h-14 shrink-0 rounded-xl border border-line bg-white object-contain" />
        <div className="min-w-0">
          <h1 className="font-display text-xl text-ink leading-snug">{event.name}</h1>
          <p className="mt-1 text-sm text-muted">احجز موعدك للفحص المجاني</p>
        </div>
      </header>

      {currentStep === 0 && (
        <section className="mb-5 bg-white border border-line rounded-2xl p-4 text-sm">
          {event.description && <p className="text-ink leading-relaxed mb-3 whitespace-pre-line">{event.description}</p>}
          <ul className="space-y-1.5 text-ink">
            {eventDates && (
              <li className="flex items-start gap-2"><CalendarDays className="w-4 h-4 shrink-0 mt-0.5 text-ink-soft" />{eventDates}</li>
            )}
            <li className="flex items-start gap-2">
              <MapPin className="w-4 h-4 shrink-0 mt-0.5 text-ink-soft" />
              {event.state || 'سيتم تحديد المكان لاحقاً'}{event.city ? `، ${event.city}` : ''}
            </li>
          </ul>
        </section>
      )}

      <StepIndicator current={currentStep} />

      <h2 className="font-display text-lg text-ink mb-4">
        {currentStep === 0 ? 'بياناتك' : currentStep === 1 ? 'اختر التخصص والموعد' : 'راجع حجزك ووافق على الشروط'}
      </h2>

      {stepContent()}

      {/* Sticky actions within thumb reach */}
      <div className="fixed inset-x-0 bottom-0 z-40 bg-white border-t border-line safe-bottom">
        <div className="max-w-xl mx-auto px-4 py-3 flex gap-2">
          {currentStep > 0 && (
            <Button variant="secondary" size="lg" icon={ChevronRight} onClick={handleBack} disabled={isSubmitting}>
              السابق
            </Button>
          )}
          {isLast ? (
            <Button
              type="submit"
              size="lg"
              className="flex-1"
              icon={CheckCircle2}
              loading={isSubmitting}
              disabled={!isFormValid || isSubmitting}
            >
              {isSubmitting ? 'جاري الحجز...' : 'احجز موعدي'}
            </Button>
          ) : (
            <Button size="lg" className="flex-1" onClick={handleNextStep}>
              التالي
              <ChevronLeft className="w-5 h-5" />
            </Button>
          )}
        </div>
      </div>
    </form>
  );
};

/** Public booking form: three steps, then the confirmation ticket. */
const RegisterVisit = () => (
  <ToastProvider>
    <div className="staff-app min-h-screen" dir="rtl">
      <RegisterVisitInner />
    </div>
  </ToastProvider>
);

export default RegisterVisit;
