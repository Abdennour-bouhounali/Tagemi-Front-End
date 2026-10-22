import { API_BASE_URL } from '../../../../config/environment';
import React, { useContext, useState } from "react";
import { AppContext } from "../../../../Context/AppContext";
import { MoreVertical, Pencil, Trash2, Stethoscope, Plus } from "lucide-react";
import {
  Button, IconButton, EmptyState, Sheet, SheetAction, Field, TextInput, useToast,
} from "../../../../Components/ui";

const apiUrl = API_BASE_URL;

/** List of specialties with a ⋮ menu per row (edit, delete). */
const SpecialityTable = ({ specialities, getSpecialites, onAdd }) => {
  const { token } = useContext(AppContext);
  const toast = useToast();
  const [actionsFor, setActionsFor] = useState(null);
  const [editing, setEditing] = useState(null);
  const [editName, setEditName] = useState("");
  const [editError, setEditError] = useState("");
  const [deleteFor, setDeleteFor] = useState(null);
  const [busy, setBusy] = useState(false);

  const handleSave = async (e) => {
    e?.preventDefault();
    if (!editName.trim()) {
      setEditError("اكتب اسم التخصص أولاً");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(`${apiUrl}/api/specialty/${editing.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: editName.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        toast(data.message || "تم حفظ التعديل");
        setEditing(null);
        getSpecialites();
      } else {
        setEditError(data.errors ? Object.values(data.errors)[0][0] : data.message || "تعذر حفظ التعديل، أعد المحاولة");
      }
    } catch {
      toast("تعذر الاتصال بالخادم، تحقق من الشبكة ثم أعد المحاولة", "error");
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    setBusy(true);
    try {
      const res = await fetch(`${apiUrl}/api/specialty/${deleteFor.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        toast(data.message || "تم حذف التخصص");
        setDeleteFor(null);
        getSpecialites();
      } else {
        toast(data.message || "تعذر حذف التخصص", "error");
      }
    } catch {
      toast("تعذر الاتصال بالخادم، تحقق من الشبكة ثم أعد المحاولة", "error");
    } finally {
      setBusy(false);
    }
  };

  const filteredSpecialties = specialities.filter((s) => s.name !== "NoSpeciality");

  return (
    <>
      {filteredSpecialties.length === 0 ? (
        <EmptyState
          icon={Stethoscope}
          title="لا توجد تخصصات بعد"
          action={onAdd && <Button icon={Plus} onClick={onAdd}>أضف أول تخصص</Button>}
        >
          أضف التخصصات لتتمكن من اختيارها عند إنشاء حدث.
        </EmptyState>
      ) : (
        <ul className="bg-white border border-line rounded-2xl divide-y divide-line">
          {filteredSpecialties.map((specialty) => (
            <li key={specialty.id} className="flex items-center gap-3 ps-4 pe-2 min-h-[3.5rem]">
              <p className="flex-1 min-w-0 font-semibold text-ink truncate">{specialty.name}</p>
              <IconButton icon={MoreVertical} label="خيارات" onClick={() => setActionsFor(specialty)} />
            </li>
          ))}
        </ul>
      )}

      <Sheet open={!!actionsFor} onClose={() => setActionsFor(null)} title={actionsFor?.name || ""}>
        {actionsFor && (
          <div className="divide-y divide-line">
            <SheetAction
              icon={Pencil}
              onClick={() => { setEditing(actionsFor); setEditName(actionsFor.name); setEditError(""); setActionsFor(null); }}
            >
              غيّر الاسم
            </SheetAction>
            <SheetAction
              icon={Trash2}
              tone="text-red-700"
              hint="يحذف معه كل البيانات المرتبطة به"
              onClick={() => { setDeleteFor(actionsFor); setActionsFor(null); }}
            >
              احذف التخصص
            </SheetAction>
          </div>
        )}
      </Sheet>

      <Sheet
        open={!!editing}
        onClose={() => setEditing(null)}
        title="تعديل التخصص"
        footer={<Button block size="lg" loading={busy} onClick={handleSave}>احفظ التغييرات</Button>}
      >
        <form onSubmit={handleSave}>
          <Field label="اسم التخصص" error={editError}>
            <TextInput value={editName} onChange={(e) => setEditName(e.target.value)} autoFocus invalid={!!editError} />
          </Field>
        </form>
      </Sheet>

      <Sheet
        open={!!deleteFor}
        onClose={() => setDeleteFor(null)}
        title={`حذف تخصص ${deleteFor?.name || ""}`}
        footer={(
          <>
            <Button variant="secondary" className="flex-1" onClick={() => setDeleteFor(null)}>تراجع</Button>
            <Button variant="danger" icon={Trash2} className="flex-1" loading={busy} onClick={handleDelete}>احذف</Button>
          </>
        )}
      >
        <p className="text-sm text-ink">سيتم حذف جميع البيانات المرتبطة بهذا التخصص، ولا يمكن التراجع عن الحذف.</p>
      </Sheet>
    </>
  );
};

export default SpecialityTable;
