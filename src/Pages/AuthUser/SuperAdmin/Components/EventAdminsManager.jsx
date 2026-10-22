import { API_BASE_URL } from '../../../../config/environment';
import { useContext, useEffect, useState, useCallback } from 'react';
import { Download, KeyRound, Trash2, Users } from 'lucide-react';
import { AppContext } from '../../../../Context/AppContext';
import { Button, Panel, Sheet, Field, TextInput, LoadingState, EmptyState, useToast } from '../../../../Components/ui';
import { ConfirmSheet, CredentialRow, downloadCredentialsCsv } from './EventFormParts';

const apiUrl = API_BASE_URL;

const ORDER = ['Special Admin', 'Recipient Admin', 'Check Admin'];

/** The three staff accounts created with an event. */
export default function EventAdminsManager({ eventId, eventName, onRefresh }) {
  const { token } = useContext(AppContext);
  const toast = useToast();
  const [credentials, setCredentials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [deleteOpen, setDeleteOpen] = useState(false);

  const fetchCredentials = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${apiUrl}/api/events/${eventId}/admins/credentials`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) setCredentials(data.credentials || []);
      else toast(data.message || 'تعذر تحميل حسابات الفريق', 'error');
    } catch {
      toast('تعذر الاتصال بالخادم', 'error');
    } finally {
      setLoading(false);
    }
  }, [eventId, token, toast]);

  useEffect(() => {
    if (eventId) fetchCredentials();
  }, [eventId, fetchCredentials]);

  const handleResetPassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      setPasswordError('اكتب 6 أحرف على الأقل');
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(`${apiUrl}/api/events/${eventId}/reset-passwords`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ new_password: newPassword }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        toast(`حُدّثت كلمة مرور ${data.updated_admins_count ?? ''} حساب`);
        setResetOpen(false);
        setNewPassword('');
        fetchCredentials();
      } else {
        toast(data.message || 'تعذر تحديث كلمات المرور', 'error');
      }
    } catch {
      toast('تعذر الاتصال بالخادم', 'error');
    } finally {
      setBusy(false);
    }
  };

  const handleDeleteAdmins = async () => {
    setBusy(true);
    try {
      const res = await fetch(`${apiUrl}/api/events/${eventId}/admins`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        toast(`حُذف ${data.deleted_admins_count ?? ''} حساب`);
        setCredentials([]);
        setDeleteOpen(false);
        onRefresh?.();
      } else {
        toast(data.message || 'تعذر حذف الحسابات', 'error');
      }
    } catch {
      toast('تعذر الاتصال بالخادم', 'error');
    } finally {
      setBusy(false);
    }
  };

  if (loading && credentials.length === 0) return <LoadingState label="جاري تحميل حسابات الفريق..." />;

  if (credentials.length === 0) {
    return (
      <div className="bg-white border border-line rounded-2xl">
        <EmptyState icon={Users} title="لا توجد حسابات فريق لهذا الحدث">
          تُنشأ الحسابات الثلاثة تلقائيًا عند إنشاء حدث جديد.
        </EmptyState>
      </div>
    );
  }

  const sorted = [...credentials].sort((a, b) => ORDER.indexOf(a.type) - ORDER.indexOf(b.type));

  return (
    <div className="space-y-4">
      <Panel title="حسابات فريق الحدث">
        <ul className="divide-y divide-line -mt-1">
          {sorted.map((cred, i) => <CredentialRow key={`${cred.type}-${i}`} credential={cred} />)}
        </ul>
        <p className="text-xs text-muted mt-2">
          لا يحفظ الخادم كلمات المرور بشكل مقروء. لإعطاء الفريق كلمة مرور جديدة استعمل «غيّر كلمة المرور».
        </p>
      </Panel>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <Button variant="secondary" icon={KeyRound} onClick={() => { setPasswordError(''); setResetOpen(true); }} disabled={busy}>
          غيّر كلمة المرور
        </Button>
        <Button variant="secondary" icon={Download} onClick={() => downloadCredentialsCsv(credentials, `${eventName}_credentials.csv`)} disabled={busy}>
          حمّل الحسابات (CSV)
        </Button>
        <Button variant="danger" icon={Trash2} onClick={() => setDeleteOpen(true)} disabled={busy}>
          احذف الحسابات
        </Button>
      </div>

      <Sheet
        open={resetOpen}
        onClose={() => setResetOpen(false)}
        title="كلمة مرور جديدة"
        footer={<Button block size="lg" loading={busy} onClick={handleResetPassword}>احفظ كلمة المرور</Button>}
      >
        <p className="text-sm text-muted mb-3">تُطبّق على الحسابات الثلاثة. أبلغ الفريق بها بعد الحفظ.</p>
        <Field label="كلمة المرور" error={passwordError} hint="6 أحرف على الأقل">
          <TextInput
            type="text"
            dir="ltr"
            autoComplete="new-password"
            value={newPassword}
            onChange={(e) => { setNewPassword(e.target.value); setPasswordError(''); }}
            invalid={!!passwordError}
          />
        </Field>
      </Sheet>

      <ConfirmSheet
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="حذف حسابات الفريق؟"
        confirmLabel="احذف الحسابات الثلاثة"
        loading={busy}
        onConfirm={handleDeleteAdmins}
      >
        <p>ستُحذف الحسابات الثلاثة لهذا الحدث ولن يتمكن الفريق من الدخول بها. لا يمكن التراجع عن ذلك.</p>
      </ConfirmSheet>
    </div>
  );
}
