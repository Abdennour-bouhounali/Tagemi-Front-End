import { useState } from 'react';
import { DoorOpen, QrCode, UserPlus, Users } from 'lucide-react';
import { Button, LoadingState, SearchField, Sheet, StatusBadge, cx } from '../../../Components/ui';

/**
 * «دخل»: confirm who goes in to the chosen doctor. The patient's family (same
 * phone, queued in this specialty) is proposed ticked; relatives who can't
 * enter now are listed with the reason. Others are added by search or QR scan
 * (onScan opens the scanner; scanned patients arrive through `members`).
 *
 * members: [{ id, patient_id, full_name, place, can_enter, reason }] (first = the patient)
 * joining: the visit in progress a relative who came late joins (then nobody is
 * "the chosen patient" and the members are the proposed relatives).
 */
export default function EnterSheet({ open, doctorName, joining, members, loading, picked, onToggle, candidates, onAdd, onScan, onConfirm, onClose, busy }) {
    const [search, setSearch] = useState('');
    const q = search.trim();
    const found = q
        ? candidates.filter((a) => a.full_name?.includes(q) || String(a.patient_id).includes(q) || a.phone?.includes(q)).slice(0, 6)
        : [];
    const count = picked.length;
    const verb = joining ? 'أضف' : 'دخل';

    return (
        <Sheet
            open={open}
            onClose={() => { setSearch(''); onClose(); }}
            title={joining ? `أضف إلى زيارة ${doctorName || 'الطبيب'}` : doctorName ? `دخل عند ${doctorName}` : 'دخل'}
            footer={(
                <Button block size="lg" icon={joining ? UserPlus : DoorOpen} loading={busy} disabled={!count} onClick={onConfirm}>
                    {count > 1 ? `${verb} (${count})` : verb}
                </Button>
            )}
        >
            {loading ? <LoadingState /> : (
                <>
                    {joining && (
                        <div className="mb-4 rounded-xl bg-st-visit-bg px-3 py-2 text-sm text-ink">
                            <p className="font-semibold">عند الطبيب الآن: {joining.patients.map((a) => a.full_name).join('، ')}</p>
                            <p className="text-xs text-muted mt-0.5">من تضيفه يدخل معهم ويجتاز معهم، ويُقسم وقت الزيارة بينهم.</p>
                        </div>
                    )}
                    {joining && members.length > 0 && (
                        <p className="flex items-center gap-1.5 text-xs text-muted mb-2">
                            <Users className="w-4 h-4" /> يُضافون إلى الزيارة (أفراد العائلة بنفس الهاتف مقترحون تلقائياً)
                        </p>
                    )}
                    <ul className="space-y-2 mb-4">
                        {members.map((m, i) => {
                            const checked = picked.includes(m.id);
                            return (
                                <li key={m.id}>
                                    <label className={cx('flex items-center gap-3 rounded-xl border p-3', m.can_enter ? 'border-line cursor-pointer' : 'border-dashed border-line bg-paper')}>
                                        <input
                                            type="checkbox"
                                            className="w-5 h-5 accent-[#101E58] shrink-0"
                                            checked={checked}
                                            disabled={!m.can_enter || (i === 0 && !joining)}
                                            onChange={() => onToggle(m.id)}
                                            aria-label={`إدخال ${m.full_name}`}
                                        />
                                        <span className="min-w-0 flex-1">
                                            <span className="block font-semibold text-ink truncate">{m.full_name}</span>
                                            <span className="block text-xs text-muted">
                                                #{m.patient_id}
                                                {m.place && <> · الدور {m.place}</>}
                                                {i === 0 && !joining && ' · الزائر المختار'}
                                                {m.reason && <> · <span className="text-st-pushed">{m.reason}</span></>}
                                            </span>
                                        </span>
                                        {m.status && !m.can_enter && <StatusBadge status={m.status} />}
                                    </label>
                                    {i === 0 && !joining && members.length > 1 && (
                                        <p className="flex items-center gap-1.5 text-xs text-muted mt-3 mb-1">
                                            <Users className="w-4 h-4" /> من نفس العائلة (نفس رقم الهاتف)
                                        </p>
                                    )}
                                </li>
                            );
                        })}
                    </ul>

                    <p className="flex items-center gap-1.5 text-sm font-semibold text-ink mb-2">
                        <UserPlus className="w-4 h-4" /> إضافة قريب آخر
                    </p>
                    <div className="flex gap-2 mb-2">
                        <SearchField value={search} onChange={setSearch} placeholder="الاسم أو رقم الزائر أو الهاتف" className="flex-1" />
                        <Button variant="secondary" icon={QrCode} onClick={onScan} aria-label="مسح رمز قريب">مسح</Button>
                    </div>
                    {q && (
                        found.length === 0 ? (
                            <p className="text-sm text-muted">لا أحد في طابور هذا التخصص بهذا الاسم أو الرقم.</p>
                        ) : (
                            <ul className="divide-y divide-line rounded-xl border border-line">
                                {found.map((a) => (
                                    <li key={a.id}>
                                        <button type="button" className="w-full flex items-center gap-3 px-3 min-h-[3rem] text-start hover:bg-ink-faint"
                                            onClick={() => { onAdd(a); setSearch(''); }}>
                                            <span className="flex-1 min-w-0">
                                                <span className="block font-semibold truncate">{a.full_name}</span>
                                                <span className="block text-xs text-muted">#{a.patient_id} · الدور {a.orderList}</span>
                                            </span>
                                            <UserPlus className="w-4 h-4 text-muted" />
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )
                    )}
                </>
            )}
        </Sheet>
    );
}
