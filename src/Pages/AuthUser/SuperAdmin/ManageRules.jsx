import { API_BASE_URL } from '../../../config/environment';
import { useCallback, useContext, useEffect, useState } from "react";
import { Plus, MoreVertical, Pencil, Trash2, ScrollText } from "lucide-react";
import { AppContext } from "../../../Context/AppContext";
import {
    Button, IconButton, PageHeader, EmptyState, LoadingState, Sheet, SheetAction, Field, useToast,
} from "../../../Components/ui";

const apiUrl = API_BASE_URL;

// Rules shown to patients before their check-ups (ضوابط الفحوصات).
export default function ManageRules() {
    const { token } = useContext(AppContext);
    const toast = useToast();

    const [rules, setRules] = useState(null);
    const [busy, setBusy] = useState(false);
    // Form sheet: null = closed, { id: null } = add, { id } = edit
    const [form, setForm] = useState(null);
    const [text, setText] = useState('');
    const [errors, setErrors] = useState({});
    const [actionsFor, setActionsFor] = useState(null);
    const [deleteFor, setDeleteFor] = useState(null);

    const fetchRules = useCallback(async () => {
        try {
            const res = await fetch(`${apiUrl}/api/rules`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (res.ok) setRules(data);
            else {
                setRules((prev) => prev || []);
                toast(data.message || 'تعذر تحميل الضوابط', 'error');
            }
        } catch {
            setRules((prev) => prev || []);
            toast('تعذر الاتصال بالخادم، تحقق من الشبكة ثم أعد المحاولة', 'error');
        }
    }, [token, toast]);

    useEffect(() => { fetchRules(); }, [fetchRules]);

    const openForm = (rule) => {
        setText(rule ? rule.rule : '');
        setErrors({});
        setForm({ id: rule ? rule.id : null });
    };

    const save = async (e) => {
        e?.preventDefault();
        if (!text.trim()) {
            setErrors({ rule: ['اكتب نص الضابط أولاً'] });
            return;
        }
        setBusy(true);
        setErrors({});
        const editing = !!form?.id;
        try {
            const res = await fetch(editing ? `${apiUrl}/api/rules/${form.id}` : `${apiUrl}/api/rules`, {
                method: editing ? 'PUT' : 'POST',
                body: JSON.stringify({ rule: text }),
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            });
            const data = await res.json().catch(() => ({}));
            if (res.ok) {
                setForm(null);
                setText('');
                fetchRules();
                toast(editing ? 'تم حفظ التعديل' : 'تمت إضافة الضابط');
            } else {
                setErrors(data.errors || {});
                if (!data.errors) toast(data.message || 'تعذر حفظ الضابط', 'error');
            }
        } catch {
            toast('تعذر الاتصال بالخادم، تحقق من الشبكة ثم أعد المحاولة', 'error');
        } finally {
            setBusy(false);
        }
    };

    const remove = async () => {
        if (!deleteFor) return;
        setBusy(true);
        try {
            const res = await fetch(`${apiUrl}/api/rules/${deleteFor.id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                fetchRules();
                toast('تم حذف الضابط');
                setDeleteFor(null);
            } else {
                const data = await res.json().catch(() => ({}));
                toast(data.message || 'تعذر حذف الضابط', 'error');
            }
        } catch {
            toast('تعذر الاتصال بالخادم، تحقق من الشبكة ثم أعد المحاولة', 'error');
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="max-w-2xl lg:max-w-none mx-auto">
            <PageHeader
                title="ضوابط الفحوصات"
                subtitle={rules ? `${rules.length} ضابط، تظهر للمرضى قبل الفحص` : 'تظهر للمرضى قبل الفحص'}
                actions={<Button icon={Plus} onClick={() => openForm(null)}>أضف ضابطاً</Button>}
            />

            {rules === null ? (
                <LoadingState />
            ) : rules.length === 0 ? (
                <EmptyState
                    icon={ScrollText}
                    title="لا توجد ضوابط بعد"
                    action={<Button icon={Plus} onClick={() => openForm(null)}>أضف أول ضابط</Button>}
                >
                    أضف الضوابط التي يجب أن يعرفها المريض قبل حضوره.
                </EmptyState>
            ) : (
                <ol className="bg-white border border-line rounded-2xl divide-y divide-line lg:grid lg:grid-cols-2 2xl:grid-cols-3 lg:gap-3 lg:bg-transparent lg:border-0 lg:rounded-none lg:divide-y-0">
                    {rules.map((rule, index) => (
                        <li key={rule.id} className="flex items-start gap-3 ps-4 pe-2 py-3 min-h-[3.5rem] lg:bg-white lg:border lg:border-line lg:rounded-2xl">
                            <span className="font-display text-sm text-muted w-6 shrink-0 pt-0.5">{index + 1}</span>
                            <p className="flex-1 min-w-0 text-ink leading-relaxed pt-0.5 break-words">{rule.rule}</p>
                            <IconButton icon={MoreVertical} label="خيارات" className="-mt-1.5" onClick={() => setActionsFor(rule)} />
                        </li>
                    ))}
                </ol>
            )}

            {/* Row menu */}
            <Sheet open={!!actionsFor} onClose={() => setActionsFor(null)} title="الضابط">
                {actionsFor && (
                    <>
                        <p className="text-sm text-muted mb-2 line-clamp-3">{actionsFor.rule}</p>
                        <div className="divide-y divide-line">
                            <SheetAction icon={Pencil} onClick={() => { openForm(actionsFor); setActionsFor(null); }}>عدّل النص</SheetAction>
                            <SheetAction icon={Trash2} tone="text-red-700" onClick={() => { setDeleteFor(actionsFor); setActionsFor(null); }}>احذف الضابط</SheetAction>
                        </div>
                    </>
                )}
            </Sheet>

            {/* Add / edit */}
            <Sheet
                open={!!form}
                onClose={() => setForm(null)}
                title={form?.id ? 'تعديل الضابط' : 'ضابط جديد'}
                footer={<Button block size="lg" loading={busy} onClick={save}>{form?.id ? 'احفظ التغييرات' : 'أضف الضابط'}</Button>}
            >
                <form onSubmit={save}>
                    <Field label="نص الضابط" error={errors.rule?.[0]}>
                        <textarea
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            rows={4}
                            autoFocus
                            placeholder="مثال: أحضر نظاراتك الطبية إن وجدت"
                            className="w-full rounded-xl border border-line p-3 text-base focus:border-ink focus:outline-none"
                        />
                    </Field>
                </form>
            </Sheet>

            {/* Delete confirm */}
            <Sheet
                open={!!deleteFor}
                onClose={() => setDeleteFor(null)}
                title="حذف الضابط"
                footer={(
                    <>
                        <Button variant="secondary" className="flex-1" onClick={() => setDeleteFor(null)}>تراجع</Button>
                        <Button variant="danger" icon={Trash2} className="flex-1" loading={busy} onClick={remove}>احذف</Button>
                    </>
                )}
            >
                <p className="text-sm text-ink">سيختفي هذا الضابط من صفحات المرضى، ولا يمكن التراجع عن الحذف.</p>
                {deleteFor && <p className="mt-2 text-sm text-muted bg-paper rounded-xl p-3">{deleteFor.rule}</p>}
            </Sheet>
        </div>
    );
}
