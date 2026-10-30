import { useState } from 'react';
import { FilePen, Trash2 } from 'lucide-react';
import { IconButton } from '../../../../Components/ui';
import { ConfirmSheet } from './EventFormParts';

const savedAt = (value) => {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString('ar-DZ', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' });
};

/** Unfinished new-event forms (saved as the super admin types): resume or delete. */
export default function EventDrafts({ drafts, onResume, onDelete }) {
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  if (!drafts.length) return null;

  const confirmDelete = async () => {
    setDeleting(true);
    await onDelete(toDelete.id);
    setDeleting(false);
    setToDelete(null);
  };

  return (
    <section className="mb-4">
      <h2 className="text-sm font-semibold text-ink mb-2">مسودات لم تكتمل ({drafts.length})</h2>
      <ul className="bg-white border border-line rounded-2xl divide-y divide-line lg:grid lg:grid-cols-2 2xl:grid-cols-3 lg:gap-3 lg:bg-transparent lg:border-0 lg:rounded-none lg:divide-y-0">
        {drafts.map((draft) => (
          <li key={draft.id} className="flex items-center gap-1 pe-1 lg:bg-white lg:border lg:border-line lg:rounded-2xl">
            <button
              type="button"
              onClick={() => onResume(draft.id)}
              className="flex-1 min-w-0 flex items-center gap-3 ps-4 py-3 min-h-[4rem] text-start hover:bg-ink-faint rounded-2xl"
            >
              <FilePen className="w-5 h-5 text-muted shrink-0" />
              <span className="flex-1 min-w-0">
                <span className="block font-semibold text-ink truncate">{draft.name || 'حدث بدون اسم'}</span>
                <span className="block text-xs text-muted">حُفظت {savedAt(draft.updated_at)} · اضغط لإكمالها</span>
              </span>
            </button>
            <IconButton icon={Trash2} label={`احذف مسودة ${draft.name || 'الحدث'}`} className="text-red-700" onClick={() => setToDelete(draft)} />
          </li>
        ))}
      </ul>

      <ConfirmSheet
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        title="حذف المسودة؟"
        confirmLabel="احذف المسودة"
        loading={deleting}
        onConfirm={confirmDelete}
      >
        <p>ستُحذف مسودة «{toDelete?.name || 'حدث بدون اسم'}» نهائيًا. الأطباء والتخصصات التي أضفتها منها تبقى.</p>
      </ConfirmSheet>
    </section>
  );
}
