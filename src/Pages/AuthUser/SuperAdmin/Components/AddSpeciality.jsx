import { API_BASE_URL } from '../../../../config/environment';
import { useContext, useEffect, useState } from "react";
import { AppContext } from "../../../../Context/AppContext";
import { Button, Sheet, Field, TextInput, useToast } from "../../../../Components/ui";

const apiUrl = API_BASE_URL;

/**
 * Sheet form that adds a specialty to the catalogue. onCreated(specialty): the new one, if given.
 * initialName: fills the name when the sheet opens (typed in a search first).
 */
export default function AddSpecialty({ open, onClose, getSpecialites, onCreated, initialName = "" }) {
  const { token } = useContext(AppContext);
  const toast = useToast();
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && initialName) setName(initialName);
  }, [open, initialName]);

  async function handleSubmit(e) {
    e?.preventDefault();
    if (!name.trim()) {
      setError("اكتب اسم التخصص أولاً");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${apiUrl}/api/specialty`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: name.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        toast(data.message || "تمت إضافة التخصص");
        setName("");
        getSpecialites?.();
        if (data.specialty) onCreated?.(data.specialty);
        onClose();
      } else if (data.errors) {
        setError(Object.values(data.errors)[0][0]);
      } else {
        setError(data.message || "تعذرت إضافة التخصص، أعد المحاولة");
      }
    } catch {
      toast("تعذر الاتصال بالخادم، تحقق من الشبكة ثم أعد المحاولة", "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="تخصص جديد"
      footer={<Button block size="lg" loading={loading} onClick={handleSubmit}>أضف التخصص</Button>}
    >
      <form onSubmit={handleSubmit}>
        <Field label="اسم التخصص" error={error}>
          <TextInput
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="مثال: طب العيون"
            autoFocus
            disabled={loading}
            invalid={!!error}
          />
        </Field>
      </form>
    </Sheet>
  );
}
