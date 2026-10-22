import { API_BASE_URL } from '../../../config/environment';
import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  MoreVertical, Users, Pencil, Trash2, UserX, UserCheck, Copy, RefreshCw, CalendarCheck, ChevronLeft, Phone, Mail,
} from "lucide-react";
import { AppContext } from "../../../Context/AppContext";
import {
  Button, IconButton, PageHeader, StatStrip, SearchField, ChipGroup, EmptyState, LoadingState,
  Sheet, SheetAction, Field, TextInput, SelectInput, useToast, cx,
} from "../../../Components/ui";

const apiUrl = API_BASE_URL;

// Static roles definition (roles are fixed in the system); replaced by /api/role when available
const ROLES = [
  { id: 1, name: "SuperAdmin" },
  { id: 2, name: "SimpleUser" },
  { id: 3, name: "SpecialAdmin" },
  { id: 4, name: "CheckAdmin" },
  { id: 5, name: "RecipientAdmin" },
  { id: 6, name: "Doctor" },
  { id: 7, name: "ContentAdmin" },
];

const ROLE_LABELS = {
  1: "مدير عام",
  2: "مستخدم عادي",
  3: "مسؤول الحالات الخاصة",
  4: "مسؤول التخصص",
  5: "مسؤول الإستقبال",
  6: "طبيب",
  7: "مسؤول المحتوى",
};
const getRoleName = (roleId) => ROLE_LABELS[roleId] || "غير محدد";

const NETWORK_ERROR = "تعذر الاتصال بالخادم، تحقق من الشبكة ثم أعد المحاولة";

export default function AllUsers() {
  const { token } = useContext(AppContext);
  const toast = useToast();

  const [users, setUsers] = useState(null);
  const [roles, setRoles] = useState(ROLES);
  const [events, setEvents] = useState([]);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("");
  const [filterEvent, setFilterEvent] = useState("");

  const [selected, setSelected] = useState(null);
  const [editFor, setEditFor] = useState(null);
  const [deleteFor, setDeleteFor] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const usersRes = await fetch(`${apiUrl}/api/users`, { headers: { Authorization: `Bearer ${token}` } });
      if (!usersRes.ok) throw new Error("users");
      const usersData = await usersRes.json();
      setUsers(usersData.users || []);

      const eventsRes = await fetch(`${apiUrl}/api/events`, { headers: { Authorization: `Bearer ${token}` } });
      if (!eventsRes.ok) throw new Error("events");
      const eventsData = await eventsRes.json();
      // Only active, non-archived events can be assigned
      setEvents((eventsData.events || []).filter((event) => event.is_active && !event.is_archived));

      try {
        const rolesRes = await fetch(`${apiUrl}/api/role`, { headers: { Authorization: `Bearer ${token}` } });
        if (rolesRes.ok) {
          const rolesData = await rolesRes.json();
          if (rolesData.roles) setRoles(rolesData.roles);
          else if (Array.isArray(rolesData)) setRoles(rolesData);
          if (rolesData.users && Array.isArray(rolesData.users)) setUsers(rolesData.users);
        }
      } catch {
        // Static roles are enough
      }
    } catch {
      setUsers((prev) => prev || []);
      toast("تعذر تحميل المستخدمين، تحقق من الشبكة ثم اختر «حدّث القائمة» من ⋮", "error");
    }
  }, [token, toast]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const all = users || [];
  const assignableRoles = roles.filter((r) => r.name !== "SuperAdmin");

  const filteredUsers = useMemo(() => {
    const q = searchTerm.toLowerCase();
    return all.filter((user) => {
      const matchesSearch = !q || user.name?.toLowerCase().includes(q) || user.email?.toLowerCase().includes(q) || user.phone?.includes(searchTerm);
      const matchesRole = filterRole ? String(user.role_id) === String(filterRole) : true;
      const matchesEvent = filterEvent
        ? filterEvent === "unassigned" ? !user.event_id : String(user.event_id) === String(filterEvent)
        : true;
      return matchesSearch && matchesRole && matchesEvent;
    });
  }, [all, searchTerm, filterRole, filterEvent]);

  const copyRegistrationLink = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/register`);
      toast("تم نسخ رابط التسجيل");
    } catch {
      toast(`تعذر النسخ، انسخ الرابط يدوياً: ${window.location.origin}/register`, "error");
    }
    setMenuOpen(false);
  };

  const roleOptions = [
    { value: "", label: "كل الأدوار", count: all.length },
    ...assignableRoles.map((r) => ({ value: String(r.id), label: getRoleName(r.id), count: all.filter((u) => String(u.role_id) === String(r.id)).length })),
  ];
  const eventOptions = [
    { value: "", label: "كل الأحداث" },
    { value: "unassigned", label: "بدون حدث" },
    ...events.map((e) => ({ value: String(e.id), label: e.name })),
  ];

  const afterChange = (text) => {
    toast(text);
    fetchData();
  };

  return (
    <div className="max-w-2xl lg:max-w-none mx-auto">
      <PageHeader
        title="المستخدمون"
        subtitle="الأدوار والأحداث المعيّنة لكل عضو في الطاقم"
        actions={<IconButton icon={MoreVertical} label="خيارات" className="bg-white border border-line" onClick={() => setMenuOpen(true)} />}
      />

      <StatStrip
        className="mb-4"
        items={[
          { label: "مستخدم", value: users ? all.length : undefined },
          { label: "معيّن لحدث", value: users ? all.filter((u) => u.event_id).length : undefined, tone: "text-st-queue" },
          { label: "بدون حدث", value: users ? all.filter((u) => !u.event_id && u.role_id !== 1).length : undefined, tone: "text-st-pushed" },
          { label: "مسؤولون", value: users ? all.filter((u) => [3, 4, 5].includes(u.role_id)).length : undefined },
        ]}
      />

      <SearchField value={searchTerm} onChange={setSearchTerm} placeholder="ابحث بالاسم أو البريد أو الهاتف" className="mb-3 lg:max-w-md" />
      <ChipGroup label="الدور" value={filterRole} onChange={setFilterRole} options={roleOptions} className="mb-2" />
      <ChipGroup label="الحدث" value={filterEvent} onChange={setFilterEvent} options={eventOptions} className="mb-3" />
      <p className="text-xs text-muted mb-3">{filteredUsers.length} من {all.length} مستخدم</p>

      {users === null ? (
        <LoadingState />
      ) : filteredUsers.length === 0 ? (
        <EmptyState icon={Users} title={all.length ? "لا أحد يطابق البحث" : "لا يوجد مستخدمون بعد"}>
          {all.length ? "غيّر الدور أو الحدث، أو امسح البحث." : "انسخ رابط التسجيل من القائمة ⋮ وأرسله إلى أعضاء الطاقم."}
        </EmptyState>
      ) : (
        <ul className="bg-white border border-line rounded-2xl divide-y divide-line lg:grid lg:grid-cols-2 2xl:grid-cols-3 lg:gap-3 lg:bg-transparent lg:border-0 lg:rounded-none lg:divide-y-0">
          {filteredUsers.map((user) => (
            <li key={user.id} className="lg:bg-white lg:border lg:border-line lg:rounded-2xl">
              <button
                type="button"
                onClick={() => setSelected(user)}
                className="w-full text-start flex items-center gap-3 px-4 py-3 min-h-[4.5rem] hover:bg-ink-faint first:rounded-t-2xl last:rounded-b-2xl"
              >
                <span className="flex-1 min-w-0">
                  <span className="block font-semibold text-ink truncate">{user.name}</span>
                  <span className="block text-xs text-muted truncate text-end" dir="ltr">{user.email}</span>
                  <span className="mt-1 flex flex-wrap items-center gap-1.5">
                    <span className={cx(
                      "inline-flex items-center h-6 px-2 rounded-md text-xs font-semibold",
                      user.role_id === 1 ? "bg-ink text-white" : "bg-ink-faint text-ink"
                    )}>
                      {getRoleName(user.role_id)}
                    </span>
                    {user.event ? (
                      <span className="text-xs text-ink-soft truncate">{user.event.name}</span>
                    ) : user.role_id !== 1 ? (
                      <span className="text-xs text-st-pushed">بدون حدث</span>
                    ) : null}
                  </span>
                </span>
                <ChevronLeft className="w-5 h-5 text-muted shrink-0" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Header menu */}
      <Sheet open={menuOpen} onClose={() => setMenuOpen(false)} title="المستخدمون">
        <div className="divide-y divide-line">
          <SheetAction icon={Copy} hint={`${window.location.origin}/register`} onClick={copyRegistrationLink}>
            انسخ رابط التسجيل
          </SheetAction>
          <SheetAction icon={RefreshCw} onClick={() => { setMenuOpen(false); fetchData(); }}>حدّث القائمة</SheetAction>
          <SheetAction
            icon={CalendarCheck}
            hint="للتدريب: حدث واحد لكل المستخدمين مع الإبقاء على أدوارهم"
            onClick={() => { setMenuOpen(false); setBulkOpen(true); }}
          >
            عيّن حدثاً لجميع المستخدمين
          </SheetAction>
        </div>
      </Sheet>

      {selected && (
        <UserSheet
          key={selected.id}
          user={selected}
          roles={assignableRoles}
          events={events}
          token={token}
          toast={toast}
          onClose={() => setSelected(null)}
          onEdit={() => { setEditFor(selected); setSelected(null); }}
          onDelete={() => { setDeleteFor(selected); setSelected(null); }}
          onChanged={(text) => { setSelected(null); afterChange(text); }}
        />
      )}

      {editFor && (
        <EditUserSheet
          key={editFor.id}
          user={editFor}
          token={token}
          toast={toast}
          onClose={() => setEditFor(null)}
          onSuccess={() => { setEditFor(null); afterChange("تم حفظ بيانات المستخدم"); }}
        />
      )}

      {deleteFor && (
        <DeleteUserSheet
          user={deleteFor}
          token={token}
          toast={toast}
          onClose={() => setDeleteFor(null)}
          onSuccess={() => { setDeleteFor(null); afterChange("تم حذف المستخدم"); }}
        />
      )}

      {bulkOpen && (
        <BulkAssignEventSheet
          events={events}
          token={token}
          toast={toast}
          onClose={() => setBulkOpen(false)}
          onSuccess={() => { setBulkOpen(false); afterChange("تم تعيين الحدث لجميع المستخدمين"); }}
        />
      )}
    </div>
  );
}

/** Detail of one user: contact, role + event assignment, and the row actions. */
function UserSheet({ user, roles, events, token, toast, onClose, onEdit, onDelete, onChanged }) {
  const isSuperAdmin = user.role_id === 1;
  // Pre-select the first event when the user has none
  const [form, setForm] = useState({
    event_id: user.event_id || (events.length > 0 ? events[0].id : ""),
    role_id: user.role_id || 2,
  });
  const [loading, setLoading] = useState(null);

  const post = async (url, body, okText, failText, kind) => {
    setLoading(kind);
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: body ? JSON.stringify(body) : undefined,
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) onChanged(okText);
      else toast(data.message || failText, "error");
    } catch {
      toast(NETWORK_ERROR, "error");
    } finally {
      setLoading(null);
    }
  };

  const assign = (e) => {
    e?.preventDefault();
    post(`${apiUrl}/api/users/${user.id}/assign`, form, "تم حفظ التعيين", "تعذر تعيين المستخدم", "assign");
  };
  const unassign = () => post(`${apiUrl}/api/users/${user.id}/unassign`, null, "تم إلغاء تعيين المستخدم من الحدث", "تعذر إلغاء التعيين", "unassign");

  return (
    <Sheet
      open
      onClose={onClose}
      title={user.name}
      footer={!isSuperAdmin && (
        <Button block size="lg" icon={UserCheck} loading={loading === "assign"} disabled={!!loading} onClick={assign}>
          احفظ التعيين
        </Button>
      )}
    >
      <div className="text-sm text-muted -mt-1 mb-4 space-y-1">
        <p className="flex items-center gap-2"><Mail className="w-4 h-4 shrink-0" /><span dir="ltr" className="truncate">{user.email}</span></p>
        {user.phone && <p className="flex items-center gap-2"><Phone className="w-4 h-4 shrink-0" /><span dir="ltr">{user.phone}</span></p>}
        <p>
          {getRoleName(user.role_id)}
          {user.event ? `، ${user.event.name}` : isSuperAdmin ? "" : "، بدون حدث"}
        </p>
      </div>

      {isSuperAdmin ? (
        <p className="text-sm text-ink bg-paper rounded-xl p-3">حساب المدير العام لا يُعدَّل ولا يُعيَّن من هذه الصفحة.</p>
      ) : (
        <>
          <form onSubmit={assign} className="space-y-3 mb-4">
            <Field label="الحدث" hint={events.length === 0 ? "لا توجد أحداث نشطة حالياً، فعّل حدثاً أولاً." : undefined}>
              <SelectInput value={form.event_id} onChange={(e) => setForm({ ...form, event_id: e.target.value })} disabled={events.length === 0}>
                <option value="">بدون حدث</option>
                {events.map((event) => <option key={event.id} value={event.id}>{event.name}</option>)}
              </SelectInput>
            </Field>
            <Field label="الدور">
              <SelectInput value={form.role_id} onChange={(e) => setForm({ ...form, role_id: e.target.value })} required>
                {roles.map((role) => <option key={role.id} value={role.id}>{getRoleName(role.id)}</option>)}
              </SelectInput>
            </Field>
          </form>

          <div className="divide-y divide-line">
            {user.event_id && (
              <SheetAction icon={UserX} hint="يبقى الحساب لكنه لا يرى أي حدث" disabled={!!loading} onClick={unassign}>
                ألغِ التعيين من الحدث
              </SheetAction>
            )}
            <SheetAction icon={Pencil} hint="الاسم، البريد، الهاتف، كلمة المرور" onClick={onEdit}>عدّل البيانات</SheetAction>
            <SheetAction icon={Trash2} tone="text-red-700" onClick={onDelete}>احذف المستخدم</SheetAction>
          </div>
        </>
      )}
    </Sheet>
  );
}

function EditUserSheet({ user, token, toast, onClose, onSuccess }) {
  const [form, setForm] = useState({ name: user.name || "", email: user.email || "", phone: user.phone || "", password: "" });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!form.name.trim() || !form.email.trim()) {
      toast("الاسم والبريد الإلكتروني مطلوبان", "error");
      return;
    }
    setLoading(true);
    try {
      const payload = { ...form };
      if (!payload.password) delete payload.password;
      const res = await fetch(`${apiUrl}/api/users/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) onSuccess();
      else toast(data.message || "تعذر حفظ البيانات، تحقق من الحقول ثم أعد المحاولة", "error");
    } catch {
      toast(NETWORK_ERROR, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet
      open
      onClose={onClose}
      title="تعديل بيانات المستخدم"
      footer={<Button block size="lg" loading={loading} onClick={handleSubmit}>احفظ التغييرات</Button>}
    >
      <form onSubmit={handleSubmit} className="space-y-3">
        <Field label="الاسم">
          <TextInput value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        </Field>
        <Field label="البريد الإلكتروني">
          <TextInput type="email" dir="ltr" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
        </Field>
        <Field label="الهاتف">
          <TextInput type="tel" dir="ltr" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        </Field>
        <Field label="كلمة مرور جديدة" hint="اتركها فارغة للإبقاء على كلمة المرور الحالية">
          <TextInput type="password" autoComplete="new-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        </Field>
      </form>
    </Sheet>
  );
}

function DeleteUserSheet({ user, token, toast, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${apiUrl}/api/users/${user.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) onSuccess();
      else toast(data.message || "تعذر حذف المستخدم", "error");
    } catch {
      toast(NETWORK_ERROR, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet
      open
      onClose={onClose}
      title="حذف المستخدم"
      footer={(
        <>
          <Button variant="secondary" className="flex-1" onClick={onClose}>تراجع</Button>
          <Button variant="danger" icon={Trash2} className="flex-1" loading={loading} onClick={handleDelete}>احذف</Button>
        </>
      )}
    >
      <p className="text-sm text-ink">سيُحذف حساب <span className="font-semibold">{user.name}</span> نهائياً ولن يستطيع الدخول، ولا يمكن التراجع عن ذلك.</p>
    </Sheet>
  );
}

/** Training helper: one event for every user (except the super admin), roles unchanged. */
function BulkAssignEventSheet({ events, token, toast, onClose, onSuccess }) {
  const [selectedEventId, setSelectedEventId] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);

  const event = events.find((e) => String(e.id) === String(selectedEventId));

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${apiUrl}/api/events/${selectedEventId}/assign-to-all-users`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) onSuccess();
      else toast(data.message || "تعذر تعيين الحدث", "error");
    } catch {
      toast(NETWORK_ERROR, "error");
    } finally {
      setLoading(false);
    }
  };

  if (confirming && event) {
    return (
      <Sheet
        open
        onClose={() => setConfirming(false)}
        title="تأكيد التعيين للجميع"
        footer={(
          <>
            <Button variant="secondary" className="flex-1" onClick={() => setConfirming(false)}>تراجع</Button>
            <Button className="flex-1" icon={CalendarCheck} loading={loading} onClick={handleSubmit}>عيّن للجميع</Button>
          </>
        )}
      >
        <p className="text-sm text-ink">
          سيُعيَّن الحدث <span className="font-semibold">{event.name}</span> لجميع المستخدمين عدا المدير العام، وتبقى أدوارهم كما هي.
          سيفقد كل مستخدم تعيينه الحالي.
        </p>
      </Sheet>
    );
  }

  return (
    <Sheet
      open
      onClose={onClose}
      title="حدث واحد لجميع المستخدمين"
      footer={<Button block size="lg" disabled={!selectedEventId} onClick={() => setConfirming(true)}>تابع</Button>}
    >
      <p className="text-sm text-muted -mt-1 mb-4">مفيد للتدريب على الحدث التجريبي. تبقى أدوار المستخدمين كما هي، ولا يتأثر المدير العام.</p>
      <Field label="الحدث" hint={events.length === 0 ? "لا توجد أحداث نشطة حالياً." : undefined}>
        <SelectInput value={selectedEventId} onChange={(e) => setSelectedEventId(e.target.value)}>
          <option value="">اختر حدثاً</option>
          {events.map((e) => (
            <option key={e.id} value={e.id}>{e.name}{e.id === 2 ? " (تجريبي)" : ""}</option>
          ))}
        </SelectInput>
      </Field>
    </Sheet>
  );
}
