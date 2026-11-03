import { cx } from '../../../../Components/ui';

/** Big number cards. items: [{ label, value, sub?, tone? }] */
export default function BigStats({ items, size = 'lg', className }) {
    const list = items.filter(Boolean);
    return (
        <div className={cx('grid grid-cols-2 gap-3 mb-4', list.length >= 8 ? 'lg:grid-cols-4' : list.length === 7 ? 'lg:grid-cols-4 xl:grid-cols-7' : list.length === 6 ? 'lg:grid-cols-3 xl:grid-cols-6' : list.length === 5 ? 'lg:grid-cols-5' : list.length === 4 ? 'lg:grid-cols-4' : 'lg:grid-cols-3', className)}>
            {list.map((item) => (
                <div key={item.label} className="rounded-2xl bg-white border border-line px-4 py-3">
                    <div className={cx('font-display leading-tight tabular-nums', size === 'lg' ? 'text-4xl lg:text-5xl' : 'text-3xl lg:text-4xl', item.tone || 'text-ink')}>
                        {item.value ?? '—'}
                    </div>
                    <div className="mt-1 text-sm font-semibold text-ink leading-snug">{item.label}</div>
                    {item.sub && <div className="text-xs text-muted leading-snug">{item.sub}</div>}
                </div>
            ))}
        </div>
    );
}
