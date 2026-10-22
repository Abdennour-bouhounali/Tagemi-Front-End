import { API_BASE_URL } from '../../../config/environment';
import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import * as XLSX from 'xlsx';
import {
  MoreVertical, Download, Phone, MessageCircle, Check, RotateCcw, Trash2, Inbox, SlidersHorizontal,
} from 'lucide-react';
import { AppContext } from '../../../Context/AppContext';
import { csvSafe } from '../../../utils/safeHtml';
import {
  Button, IconButton, PageHeader, StatStrip, SearchField, ChipGroup, EmptyState, LoadingState,
  Sheet, SheetAction, Field, useToast, cx,
} from '../../../Components/ui';

const apiUrl = API_BASE_URL;

const TYPE_LABELS = {
  help: 'مساعدة',
  aide: 'رغبة في تقديم العون',
  project_aide: 'مساهمة في مشروع',
  question: 'إستفسار',
  other: 'أخرى',
};
const getTypeLabel = (type) => TYPE_LABELS[type] || type;

const sortMessages = (list) => [...list].sort((a, b) => {
  if (a.treated !== b.treated) return a.treated ? 1 : -1;
  return new Date(b.created_at) - new Date(a.created_at);
});

const formatDate = (iso) => new Date(iso).toLocaleDateString('ar-DZ', { year: 'numeric', month: 'long', day: 'numeric' });
const formatDateTime = (iso) => new Date(iso).toLocaleString('ar-DZ', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });

// Algerian numbers: 0XXXXXXXXX or XXXXXXXXX become 213XXXXXXXXX (wa.me wants digits only)
const formatPhoneForWhatsApp = (phone) => {
  if (!phone) return '';
  const cleaned = phone.toString().replace(/\D/g, '');
  if (cleaned.startsWith('213')) return cleaned;
  if (cleaned.startsWith('0') && cleaned.length === 10) return '213' + cleaned.substring(1);
  if (cleaned.length === 9) return '213' + cleaned;
  if (cleaned.startsWith('00213')) return cleaned.substring(2);
  if (cleaned.length >= 9 && cleaned.length <= 10) return '213' + cleaned.replace(/^0+/, '');
  return cleaned;
};

const defaultReply = (m) =>
  `السلام عليكم ${m.first_name}،\n\nردًا على رسالتك:\n"${m.message.substring(0, 100)}${m.message.length > 100 ? '...' : ''}"\n\n فريق مؤسسة تجمي للتنمية الإنسانية`;

/** Contact-form inbox (super admin). */
const Messages = () => {
  const { token } = useContext(AppContext);
  const toast = useToast();

  const [messages, setMessages] = useState(null);
  const [cityFilter, setCityFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [treatedFilter, setTreatedFilter] = useState('false');
  const [processingId, setProcessingId] = useState(null);
  const [openMsg, setOpenMsg] = useState(null);
  const [deleteFor, setDeleteFor] = useState(null);
  const [whatsappFor, setWhatsappFor] = useState(null);
  const [whatsappMessage, setWhatsappMessage] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [typeSheet, setTypeSheet] = useState(false);

  const fetchMessages = useCallback(async () => {
    try {
      const res = await fetch(`${apiUrl}/api/contacts`, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (res.ok && Array.isArray(data)) setMessages(sortMessages(data));
      else {
        setMessages((prev) => prev || []);
        toast(data?.message || 'تعذر تحميل الرسائل', 'error');
      }
    } catch {
      setMessages((prev) => prev || []);
      toast('تعذر الاتصال بالخادم، تحقق من الشبكة ثم أعد المحاولة', 'error');
    }
  }, [token, toast]);

  useEffect(() => { fetchMessages(); }, [fetchMessages]);

  const all = messages || [];
  const filtered = useMemo(() => {
    let list = all;
    if (cityFilter) {
      const q = cityFilter.toLowerCase();
      list = list.filter((m) => m.wilaya?.toLowerCase().includes(q) || m.state?.toLowerCase().includes(q)
        || `${m.first_name} ${m.last_name}`.toLowerCase().includes(q) || String(m.phone || '').includes(q));
    }
    if (typeFilter) list = list.filter((m) => m.type_message?.toLowerCase() === typeFilter.toLowerCase());
    if (treatedFilter !== '') list = list.filter((m) => !!m.treated === (treatedFilter === 'true'));
    return sortMessages(list);
  }, [all, cityFilter, typeFilter, treatedFilter]);

  const treatedCount = all.filter((m) => m.treated).length;
  const untreatedCount = all.length - treatedCount;

  const handleDownloadExcel = () => {
    const rows = filtered.map((msg) => ({
      'الإسم': csvSafe(msg.first_name),
      'اللقب': csvSafe(msg.last_name),
      'رقم الهاتف': csvSafe(msg.phone),
      'الولاية': csvSafe(msg.wilaya || msg.state),
      'نوع الرسالة': getTypeLabel(msg.type_message),
      'الرسالة': csvSafe(msg.message),
      'الحالة': msg.treated ? 'معالجة' : 'غير معالجة',
      'تاريخ الإرسال': new Date(msg.created_at).toLocaleDateString('ar-DZ'),
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'messages');
    XLSX.writeFile(wb, 'messages.xlsx');
    setMenuOpen(false);
  };

  const handleToggleTreated = async (msg) => {
    setProcessingId(msg.id);
    try {
      const res = await fetch(`${apiUrl}/api/contacts/${msg.id}/toggle-treated`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.contact) {
        const patch = { treated: data.contact.treated, treated_at: data.contact.treated_at };
        setMessages((prev) => sortMessages(prev.map((m) => (m.id === msg.id ? { ...m, ...patch } : m))));
        setOpenMsg((cur) => (cur && cur.id === msg.id ? { ...cur, ...patch } : cur));
        toast(data.contact.treated ? 'تم وضع الرسالة كمعالجة' : 'أعيدت الرسالة إلى غير المعالجة');
      } else {
        toast(data.message || 'تعذر تغيير حالة الرسالة', 'error');
      }
    } catch {
      toast('تعذر الاتصال بالخادم، تحقق من الشبكة ثم أعد المحاولة', 'error');
    } finally {
      setProcessingId(null);
    }
  };

  const handleDelete = async () => {
    const id = deleteFor.id;
    setProcessingId(id);
    try {
      const res = await fetch(`${apiUrl}/api/contacts/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      });
      if (res.ok) {
        setMessages((prev) => prev.filter((m) => m.id !== id));
        setDeleteFor(null);
        toast('تم حذف الرسالة');
      } else {
        const data = await res.json().catch(() => ({}));
        toast(data.message || 'تعذر حذف الرسالة', 'error');
      }
    } catch {
      toast('تعذر الاتصال بالخادم، تحقق من الشبكة ثم أعد المحاولة', 'error');
    } finally {
      setProcessingId(null);
    }
  };

  const openWhatsApp = (msg) => {
    setWhatsappMessage(defaultReply(msg));
    setWhatsappFor(msg);
  };

  const sendWhatsAppMessage = () => {
    const phoneNumber = formatPhoneForWhatsApp(whatsappFor.phone);
    if (!phoneNumber || phoneNumber.length < 10) {
      toast('رقم الهاتف غير صحيح، لا يمكن فتح واتساب. اتصل بالمرسل هاتفياً بدلاً من ذلك.', 'error');
      return;
    }
    window.open(`https://wa.me/${phoneNumber}?text=${encodeURIComponent(whatsappMessage)}`, '_blank', 'noopener');
    setWhatsappFor(null);
    setWhatsappMessage('');
  };

  const typeOptions = [{ value: '', label: 'كل الأنواع' }, ...Object.entries(TYPE_LABELS).map(([value, label]) => ({ value, label }))];

  return (
    <div className="max-w-2xl mx-auto">
      <PageHeader
        title="الرسائل"
        subtitle="رسائل نموذج التواصل في موقع المؤسسة"
        actions={<IconButton icon={MoreVertical} label="خيارات" className="bg-white border border-line" onClick={() => setMenuOpen(true)} />}
      />

      <StatStrip
        className="mb-4"
        items={[
          { label: 'غير معالجة', value: messages ? untreatedCount : undefined, tone: 'text-st-pushed' },
          { label: 'معالجة', value: messages ? treatedCount : undefined, tone: 'text-st-queue' },
          { label: 'الإجمالي', value: messages ? all.length : undefined },
        ]}
      />

      <div className="flex gap-2 mb-3">
        <SearchField value={cityFilter} onChange={setCityFilter} placeholder="ابحث بالولاية أو الاسم أو الهاتف" className="flex-1" />
        <IconButton
          icon={SlidersHorizontal}
          label="نوع الرسالة"
          className={cx('h-12 w-12 border', typeFilter ? 'bg-ink text-white border-ink hover:bg-ink' : 'bg-white border-line')}
          onClick={() => setTypeSheet(true)}
        />
      </div>
      <ChipGroup
        label="حالة المعالجة"
        value={treatedFilter}
        onChange={setTreatedFilter}
        className="mb-2"
        options={[
          { value: 'false', label: 'غير معالجة', count: untreatedCount },
          { value: 'true', label: 'معالجة', count: treatedCount },
          { value: '', label: 'الكل', count: all.length },
        ]}
      />
      {typeFilter && (
        <p className="text-sm text-muted mb-2">
          النوع: <span className="font-semibold text-ink">{getTypeLabel(typeFilter)}</span>
          <button type="button" className="ms-2 underline min-h-[2.75rem]" onClick={() => setTypeFilter('')}>إزالة</button>
        </p>
      )}
      <p className="text-xs text-muted mb-3">{filtered.length} من {all.length} رسالة</p>

      {messages === null ? (
        <LoadingState />
      ) : filtered.length === 0 ? (
        <EmptyState icon={Inbox} title={all.length ? 'لا رسائل تطابق التصفية' : 'لا توجد رسائل'}>
          {all.length ? 'غيّر حالة المعالجة أو امسح البحث لعرض رسائل أخرى.' : 'تظهر هنا الرسائل التي يرسلها الزوار من صفحة التواصل.'}
        </EmptyState>
      ) : (
        <ul className="bg-white border border-line rounded-2xl divide-y divide-line">
          {filtered.map((m) => (
            <li key={m.id}>
              <button
                type="button"
                onClick={() => setOpenMsg(m)}
                className="w-full text-start flex items-start gap-3 px-4 py-3 min-h-[4.5rem] hover:bg-ink-faint first:rounded-t-2xl last:rounded-b-2xl"
              >
                <span
                  className={cx('mt-2 w-2.5 h-2.5 rounded-full shrink-0', m.treated ? 'bg-line' : 'bg-st-pushed')}
                  aria-label={m.treated ? 'معالجة' : 'غير معالجة'}
                />
                <span className="flex-1 min-w-0">
                  <span className="flex items-baseline justify-between gap-2">
                    <span className={cx('truncate text-ink', m.treated ? 'font-medium' : 'font-semibold')}>{m.first_name} {m.last_name}</span>
                    <span className="text-xs text-muted shrink-0">{formatDate(m.created_at)}</span>
                  </span>
                  <span className="block text-xs text-muted mt-0.5">{getTypeLabel(m.type_message)}{(m.wilaya || m.state) ? `، ${m.wilaya || m.state}` : ''}</span>
                  <span className="block text-sm text-ink-soft mt-1 line-clamp-2">{m.message}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Header menu */}
      <Sheet open={menuOpen} onClose={() => setMenuOpen(false)} title="الرسائل">
        <div className="divide-y divide-line">
          <SheetAction icon={Download} hint={`${filtered.length} رسالة حسب التصفية الحالية`} onClick={handleDownloadExcel} disabled={!filtered.length}>
            حمّل ملف Excel
          </SheetAction>
        </div>
      </Sheet>

      {/* Type filter */}
      <Sheet open={typeSheet} onClose={() => setTypeSheet(false)} title="نوع الرسالة">
        <div className="divide-y divide-line">
          {typeOptions.map((o) => (
            <SheetAction
              key={o.value || 'all'}
              icon={typeFilter === o.value ? Check : undefined}
              onClick={() => { setTypeFilter(o.value); setTypeSheet(false); }}
            >
              {o.label}
            </SheetAction>
          ))}
        </div>
      </Sheet>

      {/* Message detail */}
      <Sheet open={!!openMsg} onClose={() => setOpenMsg(null)} title={openMsg ? `${openMsg.first_name} ${openMsg.last_name}` : ''}>
        {openMsg && (
          <>
            <p className="text-sm text-muted -mt-1 mb-3">
              {getTypeLabel(openMsg.type_message)}{(openMsg.wilaya || openMsg.state) ? `، ${openMsg.wilaya || openMsg.state}` : ''}
            </p>
            <p className="text-ink whitespace-pre-wrap break-words bg-paper rounded-xl p-3 mb-2">{openMsg.message}</p>
            <p className="text-xs text-muted mb-4">
              أُرسلت في {formatDateTime(openMsg.created_at)}
              {openMsg.treated && openMsg.treated_at ? `، عولجت في ${formatDateTime(openMsg.treated_at)}` : ''}
            </p>
            <Button
              block
              size="lg"
              variant={openMsg.treated ? 'secondary' : 'success'}
              icon={openMsg.treated ? RotateCcw : Check}
              loading={processingId === openMsg.id}
              onClick={() => handleToggleTreated(openMsg)}
              className="mb-2"
            >
              {openMsg.treated ? 'أعدها إلى غير المعالجة' : 'ضع علامة: تمت المعالجة'}
            </Button>
            <div className="divide-y divide-line">
              <SheetAction icon={MessageCircle} hint={openMsg.phone} onClick={() => { openWhatsApp(openMsg); setOpenMsg(null); }}>
                ردّ عبر واتساب
              </SheetAction>
              {openMsg.phone && (
                <a href={`tel:${String(openMsg.phone).replace(/[^\d+]/g, '')}`} className="w-full flex items-center gap-3 min-h-[3.25rem] px-3 -mx-3 rounded-xl hover:bg-ink-faint text-ink">
                  <Phone className="w-5 h-5 shrink-0" />
                  <span className="flex-1 font-semibold">اتصل بالمرسل</span>
                  <span className="text-sm text-muted" dir="ltr">{openMsg.phone}</span>
                </a>
              )}
              <SheetAction icon={Trash2} tone="text-red-700" onClick={() => { setDeleteFor(openMsg); setOpenMsg(null); }}>
                احذف الرسالة
              </SheetAction>
            </div>
          </>
        )}
      </Sheet>

      {/* WhatsApp composer */}
      <Sheet
        open={!!whatsappFor}
        onClose={() => setWhatsappFor(null)}
        title="الرد عبر واتساب"
        footer={(
          <Button block size="lg" variant="success" icon={MessageCircle} disabled={!whatsappMessage.trim()} onClick={sendWhatsAppMessage}>
            افتح واتساب
          </Button>
        )}
      >
        {whatsappFor && (
          <>
            <p className="text-sm text-muted -mt-1 mb-3">
              إلى {whatsappFor.first_name} {whatsappFor.last_name} على الرقم <span dir="ltr" className="font-semibold text-ink">+{formatPhoneForWhatsApp(whatsappFor.phone)}</span>
            </p>
            <Field label="نص الرد" hint={`${whatsappMessage.length} حرف. يُرسل من حساب واتساب المفتوح على هذا الجهاز.`}>
              <textarea
                value={whatsappMessage}
                onChange={(e) => setWhatsappMessage(e.target.value)}
                rows={8}
                className="w-full rounded-xl border border-line p-3 text-base focus:border-ink focus:outline-none"
              />
            </Field>
            <button type="button" className="mt-1 text-sm text-ink-soft underline min-h-[2.75rem]" onClick={() => setWhatsappMessage(defaultReply(whatsappFor))}>
              استرجع النص الافتراضي
            </button>
          </>
        )}
      </Sheet>

      {/* Delete confirm */}
      <Sheet
        open={!!deleteFor}
        onClose={() => setDeleteFor(null)}
        title="حذف الرسالة"
        footer={(
          <>
            <Button variant="secondary" className="flex-1" onClick={() => setDeleteFor(null)}>تراجع</Button>
            <Button variant="danger" icon={Trash2} className="flex-1" loading={deleteFor && processingId === deleteFor.id} onClick={handleDelete}>احذف</Button>
          </>
        )}
      >
        <p className="text-sm text-ink">ستُحذف رسالة {deleteFor?.first_name} {deleteFor?.last_name} نهائياً، ولا يمكن التراجع عن ذلك.</p>
      </Sheet>
    </div>
  );
};

export default Messages;
