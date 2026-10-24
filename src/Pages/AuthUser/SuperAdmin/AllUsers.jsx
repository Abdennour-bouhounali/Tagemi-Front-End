import { API_BASE_URL } from '../../../config/environment';
import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  MoreVertical, Users, Pencil, Trash2, UserX, UserCheck, Copy, RefreshCw, CalendarCheck, Phone, Mail,
  FilterX, Shield, X, Loader2,
} from "lucide-react";
import { AppContext } from "../../../Context/AppContext";
import {
  Button, IconButton, PageHeader, StatStrip, SearchField, EmptyState, LoadingState,
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

const SORTS = {
  newest: { label: "الأحدث تسجيلاً", fn: (a, b) => String(b.created_at || "").localeCompare(String(a.created_at || "")) },
  name: { label: "الاسم", fn: (a, b) => (a.name || "").localeCompare(b.name || "", "ar") },
  role: { label: "الدور", fn: (a, b) => getRoleName(a.role_id).localeCompare(getRoleName(b.role_id), "ar") },
  event: { label: "الحدث", fn: (a, b) => (a.event?.name || "ي").localeCompare(b.event?.name || "ي", "ar") },
};

const smallSelect = "h-9 rounded-lg border border-line bg-white px-2 pe-7 text-sm text-ink focus:border-ink focus:outline-none disabled:bg-paper disabled:text-muted";

export default function AllUsers() {
  const { token } = useContext(AppContext);
  const toast = useToast();

  const [users, setUsers] = useState(null);
  const [roles, setRoles] = useState(ROLES);
  const [events, setEvents] = useState([]);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("");
  const [filterEvent, setFilterEvent] = useState("");
  const [sortBy, setSortBy] = useState("newest");

  const [checked, setChecked] = useState([]);
  const [savingId, setSavingId] = useState(null);
  const [bulkAction, setBulkAction] = useState(null); // 'event' | 'role' | 'unassign'

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

  const all = useMemo(() => users || [], [users]);
  const assignableRoles = roles.filter((r) => r.name !== "SuperAdmin" && r.id !== 1);

  const filteredUsers = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return all
      .filter((user) => {
        const matchesSearch = !q || user.name?.toLowerCase().includes(q) || user.email?.toLowerCase().includes(q) || user.phone?.includes(q);
        const matchesRole = filterRole ? String(user.role_id) === String(filterRole) : true;
        const matchesEvent = filterEvent
          ? filterEvent === "unassigned" ? !user.event_id && user.role_id !== 1 : String(user.event_id) === String(filterEvent)
          : true;
        return matchesSearch && matchesRole && matchesEvent;
      })
      .sort(SORTS[sortBy].fn);
  }, [all, searchTerm, filterRole, filterEvent, sortBy]);

  // Selection only covers users the admin may change, and stays within the current filter
  const selectable = filteredUsers.filter((u) => u.role_id !== 1);
  const visibleChecked = checked.filter((id) => selectable.some((u) => u.id === id));
  const allChecked = selectable.length > 0 && visibleChecked.length === selectable.length;
  const toggle = (id) => setChecked((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  const toggleAll = () => setChecked(allChecked ? [] : selectable.map((u) => u.id));
  const hasFilters = searchTerm || filterRole || filterEvent;

  const copyRegistrationLink = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/register`);
      toast("تم نسخ رابط التسجيل");
    } catch {
      toast(`تعذر النسخ، انسخ الرابط يدوياً: ${window.location.origin}/register`, "error");
    }
    setMenuOpen(false);
  };

  // Events seen on users (archived ones included) so the filter can find them too
  const filterEvents = useMemo(() => {
    const map = new Map(events.map((e) => [String(e.id), e.name]));
    all.forEach((u) => u.event_id && !map.has(String(u.event_id)) && map.set(String(u.event_id), u.event?.name || `حدث ${u.event_id}`));
    return [...map.entries()];
  }, [events, all]);

  const afterChange = (text) => {
    toast(text);
    fetchData();
  };

  /** Inline change of one user's role or event, saved straight away. */
  const saveRow = async (user, changes) => {
    setSavingId(user.id);
    const body = { event_id: user.event_id || null, role_id: user.role_id, ...changes };
    try {
      const res = await fetch(`${apiUrl}/api/users/${user.id}/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, ...(data.user || body) } : u)));
        toast(`تم حفظ تعيين ${user.name}`);
      } else {
        toast(data.message || "تعذر حفظ التعيين", "error");
      }
    } catch {
      toast(NETWORK_ERROR, "error");
    } finally {
      setSavingId(null);
    }
  };

  const eventName = (user) => user.event?.name || events.find((e) => e.id === user.event_id)?.name;

  const roleSelect = (user) => (
    <select
      aria-label={`دور ${user.name}`}
      className={cx(smallSelect, "w-full")}
      value={user.role_id}
      disabled={savingId === user.id}
      onChange={(e) => saveRow(user, { role_id: Number(e.target.value) })}
    >
      {assignableRoles.map((role) => <option key={role.id} value={role.id}>{getRoleName(role.id)}</option>)}
    </select>
  );

  const eventSelect = (user) => {
    const archived = user.event_id && !events.some((e) => e.id === user.event_id);
    return (
      <select
        aria-label={`حدث ${user.name}`}
        className={cx(smallSelect, "w-full", !user.event_id && "text-st-pushed")}
        value={user.event_id || ""}
        disabled={savingId === user.id}
        onChange={(e) => saveRow(user, { event_id: e.target.value ? Number(e.target.value) : null })}
      >
        <option value="">بدون حدث</option>
        {archived && <option value={user.event_id}>{eventName(user) || `حدث ${user.event_id}`}</option>}
        {events.map((event) => <option key={event.id} value={event.id}>{event.name}</option>)}
      </select>
    );
  };

  const checkbox = (user) =>
    user.role_id === 1 ? null : (
      <input
        type="checkbox"
        className="w-5 h-5 accent-[#101E58] cursor-pointer"
        checked={checked.includes(user.id)}
        onChange={() => toggle(user.id)}
        aria-label={`تحديد ${user.name}`}
      />
    );

  return (
    <div className="max-w-2xl lg:max-w-none mx-auto pb-24">
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

      {/* Filters */}
      <div className="bg-white border border-line rounded-2xl p-3 mb-3 grid grid-cols-2 gap-2 lg:grid-cols-[minmax(0,2fr)_repeat(3,minmax(0,1fr))_auto] lg:items-end">
        <SearchField value={searchTerm} onChange={setSearchTerm} placeholder="ابحث بالاسم أو البريد أو الهاتف" className="col-span-2 lg:col-span-1" />
        <Field label="الدور">
          <SelectInput value={filterRole} onChange={(e) => setFilterRole(e.target.value)}>
            <option value="">كل الأدوار ({all.length})</option>
            {roles.map((r) => (
              <option key={r.id} value={r.id}>{getRoleName(r.id)} ({all.filter((u) => String(u.role_id) === String(r.id)).length})</option>
            ))}
          </SelectInput>
        </Field>
        <Field label="الحدث">
          <SelectInput value={filterEvent} onChange={(e) => setFilterEvent(e.target.value)}>
            <option value="">كل الأحداث</option>
            <option value="unassigned">بدون حدث</option>
            {filterEvents.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
          </SelectInput>
        </Field>
        <Field label="الترتيب">
          <SelectInput value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            {Object.entries(SORTS).map(([key, s]) => <option key={key} value={key}>{s.label}</option>)}
          </SelectInput>
        </Field>
        <Button
          variant="ghost"
          icon={FilterX}
          className="h-12 self-end"
          disabled={!hasFilters}
          onClick={() => { setSearchTerm(""); setFilterRole(""); setFilterEvent(""); }}
        >
          امسح
        </Button>
      </div>

      <div className="flex items-center justify-between gap-2 mb-2 px-1">
        <p className="text-xs text-muted">{filteredUsers.length} من {all.length} مستخدم</p>
        {selectable.length > 0 && (
          <label className="md:hidden flex items-center gap-2 text-sm font-semibold text-ink">
            <input type="checkbox" className="w-5 h-5 accent-[#101E58]" checked={allChecked} onChange={toggleAll} />
            تحديد الكل
          </label>
        )}
      </div>

      {users === null ? (
        <LoadingState />
      ) : filteredUsers.length === 0 ? (
        <EmptyState icon={Users} title={all.length ? "لا أحد يطابق البحث" : "لا يوجد مستخدمون بعد"}>
          {all.length ? "غيّر الدور أو الحدث، أو امسح البحث." : "انسخ رابط التسجيل من القائمة ⋮ وأرسله إلى أعضاء الطاقم."}
        </EmptyState>
      ) : (
        <>
          {/* Table (tablet and desktop) */}
          <div className="hidden md:block bg-white border border-line rounded-2xl overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-paper text-muted text-xs">
                <tr className="text-start">
                  <th className="w-12 px-3 py-3">
                    <input
                      type="checkbox"
                      className="w-5 h-5 accent-[#101E58] cursor-pointer align-middle"
                      checked={allChecked}
                      disabled={!selectable.length}
                      onChange={toggleAll}
                      aria-label="تحديد الكل"
                    />
                  </th>
                  <th className="px-3 py-3 text-start font-semibold">المستخدم</th>
                  <th className="px-3 py-3 text-start font-semibold">الهاتف</th>
                  <th className="px-3 py-3 text-start font-semibold w-60">الدور</th>
                  <th className="px-3 py-3 text-start font-semibold w-56">الحدث</th>
                  <th className="px-3 py-3 text-start font-semibold">التسجيل</th>
                  <th className="w-12 px-2 py-3"><span className="sr-only">خيارات</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {filteredUsers.map((user) => {
                  const isChecked = checked.includes(user.id);
                  return (
                    <tr key={user.id} className={cx("align-middle", isChecked ? "bg-ink-faint" : "hover:bg-paper/60")}>
                      <td className="px-3 py-2 text-center">{checkbox(user)}</td>
                      <td className="px-3 py-2 max-w-[16rem]">
                        <button type="button" className="block text-start w-full" onClick={() => setSelected(user)}>
                          <span className="block font-semibold text-ink truncate hover:underline">{user.name}</span>
                          <span className="block text-xs text-muted truncate text-end" dir="ltr">{user.email}</span>
                        </button>
                      </td>
                      <td className="px-3 py-2 text-ink-soft whitespace-nowrap" dir="ltr">{user.phone || "—"}</td>
                      <td className="px-3 py-2">
                        {user.role_id === 1 ? (
                          <span className="inline-flex items-center h-7 px-2 rounded-md text-xs font-semibold bg-ink text-white">{getRoleName(1)}</span>
                        ) : roleSelect(user)}
                      </td>
                      <td className="px-3 py-2">
                        {user.role_id === 1 ? <span className="text-xs text-muted">كل الأحداث</span> : eventSelect(user)}
                      </td>
                      <td className="px-3 py-2 text-xs text-muted whitespace-nowrap">{formatDate(user.created_at)}</td>
                      <td className="px-2 py-2">
                        {savingId === user.id ? (
                          <Loader2 className="w-5 h-5 animate-spin text-muted mx-auto" />
                        ) : (
                          <IconButton icon={MoreVertical} label="خيارات" className="w-9 h-9" onClick={() => setSelected(user)} />
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Cards (phone) */}
          <ul className="md:hidden bg-white border border-line rounded-2xl divide-y divide-line">
            {filteredUsers.map((user) => (
              <li key={user.id} className={cx("px-3 py-3", checked.includes(user.id) && "bg-ink-faint")}>
                <div className="flex items-start gap-3">
                  <div className="pt-1 w-5 shrink-0">{checkbox(user)}</div>
                  <button type="button" className="flex-1 min-w-0 text-start" onClick={() => setSelected(user)}>
                    <span className="block font-semibold text-ink truncate">{user.name}</span>
                    <span className="block text-xs text-muted truncate text-end" dir="ltr">{user.email}</span>
                  </button>
                  {savingId === user.id ? (
                    <Loader2 className="w-5 h-5 animate-spin text-muted mt-1" />
                  ) : (
                    <IconButton icon={MoreVertical} label="خيارات" className="w-9 h-9 -me-1" onClick={() => setSelected(user)} />
                  )}
                </div>
                {user.role_id === 1 ? (
                  <span className="ms-8 mt-2 inline-flex items-center h-6 px-2 rounded-md text-xs font-semibold bg-ink text-white">{getRoleName(1)}</span>
                ) : (
                  <div className="ms-8 mt-2 grid grid-cols-2 gap-2">
                    {roleSelect(user)}
                    {eventSelect(user)}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </>
      )}

      {/* Bulk bar above the tab bar */}
      {visibleChecked.length > 0 && (
        <div className="fixed inset-x-0 lg:start-24 bottom-[4.75rem] lg:bottom-6 z-40 px-4 lg:px-8">
          <div className="max-w-3xl mx-auto flex flex-wrap items-center gap-2 bg-ink text-white rounded-2xl p-2 ps-4 shadow-lg">
            <span className="flex-1 min-w-[6rem] text-sm font-semibold">تم تحديد {visibleChecked.length}</span>
            <Button size="sm" variant="secondary" icon={CalendarCheck} onClick={() => setBulkAction("event")}>عيّن حدثاً</Button>
            <Button size="sm" variant="secondary" icon={Shield} onClick={() => setBulkAction("role")}>امنح دوراً</Button>
            <Button size="sm" variant="secondary" icon={UserX} onClick={() => setBulkAction("unassign")}>
              <span className="hidden sm:inline">ألغِ التعيين</span>
            </Button>
            <IconButton icon={X} label="إلغاء التحديد" className="w-9 h-9 text-white hover:bg-white/10" onClick={() => setChecked([])} />
          </div>
        </div>
      )}

      {bulkAction && (
        <BulkActionSheet
          action={bulkAction}
          users={all.filter((u) => visibleChecked.includes(u.id))}
          roles={assignableRoles}
          events={events}
          token={token}
          toast={toast}
          onClose={() => setBulkAction(null)}
          onSuccess={(text) => { setBulkAction(null); setChecked([]); afterChange(text); }}
        />
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

function formatDate(value) {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString("ar-DZ", { year: "numeric", month: "short", day: "numeric" });
}

/** Event, role or unassign for the checked users, through /api/users/bulk-assign. */
function BulkActionSheet({ action, users, roles, events, token, toast, onClose, onSuccess }) {
  const [value, setValue] = useState(action === "event" ? String(events[0]?.id || "") : action === "role" ? String(roles[0]?.id || "") : "");
  const [loading, setLoading] = useState(false);

  const title = { event: "عيّن حدثاً للمحددين", role: "امنح دوراً للمحددين", unassign: "ألغِ تعيين المحددين" }[action];
  const target = action === "event" ? events.find((e) => String(e.id) === value)?.name : action === "role" ? getRoleName(Number(value)) : null;

  const submit = async () => {
    const body = { user_ids: users.map((u) => u.id) };
    if (action === "event") body.event_id = Number(value);
    if (action === "role") body.role_id = Number(value);
    if (action === "unassign") body.event_id = null;
    setLoading(true);
    try {
      const res = await fetch(`${apiUrl}/api/users/bulk-assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) onSuccess(data.message || "تم التحديث");
      else toast(data.message || "تعذر تطبيق التغيير", "error");
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
      title={title}
      footer={(
        <>
          <Button variant="secondary" className="flex-1" onClick={onClose}>تراجع</Button>
          <Button
            className="flex-1"
            variant={action === "unassign" ? "danger" : "primary"}
            icon={action === "unassign" ? UserX : UserCheck}
            loading={loading}
            disabled={action !== "unassign" && !value}
            onClick={submit}
          >
            طبّق على {users.length}
          </Button>
        </>
      )}
    >
      {action === "event" && (
        <Field label="الحدث" hint={events.length === 0 ? "لا توجد أحداث نشطة حالياً، فعّل حدثاً أولاً." : "تبقى أدوارهم كما هي."} className="mb-4">
          <SelectInput value={value} onChange={(e) => setValue(e.target.value)} disabled={events.length === 0}>
            {events.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
          </SelectInput>
        </Field>
      )}
      {action === "role" && (
        <Field label="الدور" hint="تبقى أحداثهم كما هي." className="mb-4">
          <SelectInput value={value} onChange={(e) => setValue(e.target.value)}>
            {roles.map((r) => <option key={r.id} value={r.id}>{getRoleName(r.id)}</option>)}
          </SelectInput>
        </Field>
      )}
      <p className="text-sm text-ink mb-2">
        {action === "unassign"
          ? "يبقى الحساب لكنه لن يرى أي حدث:"
          : <>سيصبح {target ? <span className="font-semibold">«{target}»</span> : "التغيير"} لهؤلاء:</>}
      </p>
      <ul className="max-h-48 overflow-y-auto bg-paper rounded-xl divide-y divide-line text-sm">
        {users.map((u) => (
          <li key={u.id} className="flex items-center justify-between gap-2 px-3 py-2">
            <span className="truncate text-ink">{u.name}</span>
            <span className="shrink-0 text-xs text-muted">{getRoleName(u.role_id)}{u.event?.name ? `، ${u.event.name}` : ""}</span>
          </li>
        ))}
      </ul>
    </Sheet>
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
