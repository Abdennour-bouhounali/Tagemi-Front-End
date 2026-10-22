import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import * as XLSX from 'xlsx';
import { MoreVertical, Download, Phone, Mail, MessageCircle, Trash2, Users, ChevronLeft } from 'lucide-react';
import { AppContext } from '../../../Context/AppContext';
import { csvSafe } from '../../../utils/safeHtml';
import {
  Button, IconButton, PageHeader, SearchField, ChipGroup, EmptyState, LoadingState, Sheet, SheetAction, useToast,
} from '../../../Components/ui';

const apiUrl = import.meta.env.VITE_API_URL;

// Algerian numbers: 0XXXXXXXXX or XXXXXXXXX become 213XXXXXXXXX (wa.me wants digits only)
const toWhatsApp = (phone) => {
  const cleaned = String(phone || '').replace(/\D/g, '');
  if (!cleaned) return '';
  if (cleaned.startsWith('213')) return cleaned;
  if (cleaned.startsWith('00213')) return cleaned.substring(2);
  if (cleaned.length >= 9 && cleaned.length <= 10) return '213' + cleaned.replace(/^0+/, '');
  return cleaned;
};

const DETAIL_FIELDS = [
  ['phone_number', 'رقم الهاتف'],
  ['email_address', 'البريد الإلكتروني'],
  ['date_of_birth', 'تاريخ الميلاد'],
  ['gender', 'الجنس'],
  ['city', 'المدينة'],
  ['state', 'الولاية'],
  ['relevant_skills', 'المهارات'],
  ['previous_volunteering_experience', 'تجارب تطوع سابقة'],
  ['professional_background', 'الخلفية المهنية'],
  ['areas_of_interest', 'مجالات الاهتمام'],
  ['preferred_types_of_activities', 'الأنشطة المفضلة'],
  ['reasons_for_volunteering', 'دوافع التطوع'],
];

/** Volunteer sign-ups from the public site (super admin). */
const Volunteers = () => {
  const { token } = useContext(AppContext);
  const toast = useToast();
  const [volunteers, setVolunteers] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [stateFilter, setStateFilter] = useState('');
  const [selected, setSelected] = useState(null);
  const [deleteFor, setDeleteFor] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const fetchVolunteers = useCallback(async () => {
    try {
      const res = await fetch(`${apiUrl}/api/volunteers`, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      });
      const data = await res.json();
      if (res.ok && Array.isArray(data)) setVolunteers(data);
      else {
        setVolunteers((prev) => prev || []);
        toast(data?.message || 'تعذر تحميل المتطوعين', 'error');
      }
    } catch {
      setVolunteers((prev) => prev || []);
      toast('تعذر الاتصال بالخادم، تحقق من الشبكة ثم أعد المحاولة', 'error');
    }
  }, [token, toast]);

  useEffect(() => { fetchVolunteers(); }, [fetchVolunteers]);

  const all = volunteers || [];
  const states = useMemo(() => [...new Set(all.map((v) => v.state).filter(Boolean))], [all]);
  const filtered = useMemo(() => {
    const q = searchTerm.toLowerCase();
    return all.filter((v) =>
      (v.full_name || '').toLowerCase().includes(q) && (stateFilter === '' || v.state === stateFilter));
  }, [all, searchTerm, stateFilter]);

  const handleDelete = async () => {
    setBusy(true);
    try {
      const res = await fetch(`${apiUrl}/api/volunteers/${deleteFor.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      });
      if (res.ok) {
        setVolunteers((prev) => prev.filter((v) => v.id !== deleteFor.id));
        setDeleteFor(null);
        toast('تم حذف المتطوع');
      } else {
        const data = await res.json().catch(() => ({}));
        toast(data.message || 'تعذر حذف المتطوع', 'error');
      }
    } catch {
      toast('تعذر الاتصال بالخادم، تحقق من الشبكة ثم أعد المحاولة', 'error');
    } finally {
      setBusy(false);
    }
  };

  const handleDownloadExcel = () => {
    // Same columns as before (every field of the record), cells neutralised against formulas
    const rows = filtered.map((v) => Object.fromEntries(Object.entries(v).map(([k, val]) => [k, typeof val === 'string' ? csvSafe(val) : val])));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Volunteers');
    XLSX.writeFile(wb, 'volunteers.xlsx');
    setMenuOpen(false);
  };

  const stateOptions = [
    { value: '', label: 'كل الولايات', count: all.length },
    ...states.map((s) => ({ value: s, label: s, count: all.filter((v) => v.state === s).length })),
  ];

  const ContactLink = ({ href, icon: Icon, children, hint, external }) => (
    <a
      href={href}
      target={external ? '_blank' : undefined}
      rel={external ? 'noopener noreferrer' : undefined}
      className="w-full flex items-center gap-3 min-h-[3.25rem] px-3 -mx-3 rounded-xl hover:bg-ink-faint text-ink"
    >
      <Icon className="w-5 h-5 shrink-0" />
      <span className="flex-1 font-semibold">{children}</span>
      {hint && <span className="text-sm text-muted truncate max-w-[50%]" dir="ltr">{hint}</span>}
    </a>
  );

  return (
    <div className="max-w-2xl mx-auto">
      <PageHeader
        title="المتطوعون"
        subtitle={volunteers ? `${all.length} متطوع سجّلوا عبر موقع المؤسسة` : 'المسجلون عبر موقع المؤسسة'}
        actions={<IconButton icon={MoreVertical} label="خيارات" className="bg-white border border-line" onClick={() => setMenuOpen(true)} />}
      />

      <SearchField value={searchTerm} onChange={setSearchTerm} placeholder="ابحث بالاسم" className="mb-3" />
      {states.length > 0 && (
        <ChipGroup label="الولاية" value={stateFilter} onChange={setStateFilter} options={stateOptions} className="mb-3" />
      )}

      {volunteers === null ? (
        <LoadingState />
      ) : filtered.length === 0 ? (
        <EmptyState icon={Users} title={all.length ? 'لا أحد يطابق البحث' : 'لا يوجد متطوعون بعد'}>
          {all.length ? 'جرّب اسماً آخر أو اختر «كل الولايات».' : 'يظهر هنا كل من يملأ استمارة التطوع في موقع المؤسسة.'}
        </EmptyState>
      ) : (
        <ul className="bg-white border border-line rounded-2xl divide-y divide-line">
          {filtered.map((v) => (
            <li key={v.id}>
              <button
                type="button"
                onClick={() => setSelected(v)}
                className="w-full text-start flex items-center gap-3 px-4 py-3 min-h-[4rem] hover:bg-ink-faint first:rounded-t-2xl last:rounded-b-2xl"
              >
                <span className="flex-1 min-w-0">
                  <span className="block font-semibold text-ink truncate">{v.full_name}</span>
                  <span className="block text-xs text-muted mt-0.5 truncate">
                    {[v.city, v.state].filter(Boolean).join('، ')}
                  </span>
                </span>
                <span className="text-sm text-muted shrink-0" dir="ltr">{v.phone_number}</span>
                <ChevronLeft className="w-5 h-5 text-muted shrink-0" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <Sheet open={menuOpen} onClose={() => setMenuOpen(false)} title="المتطوعون">
        <div className="divide-y divide-line">
          <SheetAction icon={Download} hint={`${filtered.length} متطوع حسب التصفية الحالية`} onClick={handleDownloadExcel} disabled={!filtered.length}>
            حمّل ملف Excel
          </SheetAction>
        </div>
      </Sheet>

      <Sheet open={!!selected} onClose={() => setSelected(null)} title={selected?.full_name || ''} size="lg">
        {selected && (
          <>
            <div className="divide-y divide-line mb-4">
              {selected.phone_number && toWhatsApp(selected.phone_number) && (
                <ContactLink href={`https://wa.me/${toWhatsApp(selected.phone_number)}`} icon={MessageCircle} external>
                  راسله عبر واتساب
                </ContactLink>
              )}
              {selected.phone_number && (
                <ContactLink href={`tel:${String(selected.phone_number).replace(/[^\d+]/g, '')}`} icon={Phone} hint={selected.phone_number}>
                  اتصل به
                </ContactLink>
              )}
              {selected.email_address && (
                <ContactLink href={`mailto:${selected.email_address}`} icon={Mail} hint={selected.email_address}>
                  أرسل بريداً
                </ContactLink>
              )}
            </div>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3 text-sm mb-4">
              {DETAIL_FIELDS.map(([key, label], i) => (
                <div key={key} className={i >= 6 ? 'sm:col-span-2' : undefined}>
                  <dt className="text-muted">{label}</dt>
                  <dd className="font-semibold text-ink break-words whitespace-pre-wrap">{selected[key] || 'غير محدد'}</dd>
                </div>
              ))}
            </dl>
            <Button variant="danger" icon={Trash2} block onClick={() => { setDeleteFor(selected); setSelected(null); }}>
              احذف المتطوع
            </Button>
          </>
        )}
      </Sheet>

      <Sheet
        open={!!deleteFor}
        onClose={() => setDeleteFor(null)}
        title="حذف المتطوع"
        footer={(
          <>
            <Button variant="secondary" className="flex-1" onClick={() => setDeleteFor(null)}>تراجع</Button>
            <Button variant="danger" icon={Trash2} className="flex-1" loading={busy} onClick={handleDelete}>احذف</Button>
          </>
        )}
      >
        <p className="text-sm text-ink">سيُحذف {deleteFor?.full_name} من قائمة المتطوعين نهائياً، ولا يمكن التراجع عن ذلك.</p>
      </Sheet>
    </div>
  );
};

export default Volunteers;
