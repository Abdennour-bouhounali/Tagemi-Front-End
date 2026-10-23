import { memo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Calendar, Edit, ImageIcon, MapPin, Play, Trash2, Users } from 'lucide-react';
import { mediaUrl } from '../../../../utils/publicApi';

const STATUS = {
    upcoming: { en: 'Upcoming', ar: 'قادم', cls: 'bg-sky-500' },
    ongoing: { en: 'Ongoing', ar: 'جاري', cls: 'bg-emerald-500' },
    completed: { en: 'Completed', ar: 'منجز', cls: 'bg-[#101E58]' },
    cancelled: { en: 'Cancelled', ar: 'ملغى', cls: 'bg-gray-500' },
};

const stripHtml = (html = '') => html.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();

// Public list responses carry `excerpt_*` and a `cover`; staff get the full record instead.
export const activityTitle = (a, lang) => (lang === 'en' ? a.title_en : a.title_ar);
export const activityExcerpt = (a, lang) => {
    const ready = lang === 'en' ? a.excerpt_en : a.excerpt_ar;
    if (ready) return ready;
    const text = stripHtml(lang === 'en' ? a.description_en : a.description_ar);
    return text.length > 180 ? `${text.slice(0, 180)}…` : text;
};
export const activityCover = (a) => a.cover || a.media?.[0] || null;

export const formatDate = (value, lang, opts = { year: 'numeric', month: 'short', day: 'numeric' }) =>
    value ? new Date(value).toLocaleDateString(lang === 'en' ? 'en-US' : 'ar-DZ', opts) : '';

function Cover({ activity, lang, priority }) {
    const cover = activityCover(activity);
    if (!cover) {
        return (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#101E58] to-[#2A3A7A]">
                <ImageIcon className="w-10 h-10 text-white/40" />
            </div>
        );
    }
    if (cover.type === 'video') {
        return (
            <div className="w-full h-full flex items-center justify-center bg-[#101E58]">
                <span className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center">
                    <Play className="w-6 h-6 text-[#E03A6F]" fill="currentColor" />
                </span>
            </div>
        );
    }
    return (
        <img
            src={mediaUrl(cover.url)}
            alt={activityTitle(activity, lang)}
            loading={priority ? 'eager' : 'lazy'}
            fetchPriority={priority ? 'high' : 'auto'}
            decoding="async"
            width="640"
            height="480"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = '/tagemi_consept-800.webp';
            }}
        />
    );
}

function ActivityCard({ activity, lang, layout = 'grid', priority = false, onEdit, onDelete }) {
    const status = STATUS[activity.status];
    const isList = layout === 'list';
    const date = activity.event_date
        ? activity.event_end_date && activity.event_end_date !== activity.event_date
            ? `${formatDate(activity.event_date, lang)} – ${formatDate(activity.event_end_date, lang)}`
            : formatDate(activity.event_date, lang, { year: 'numeric', month: 'long', day: 'numeric' })
        : '';
    const mediaCount = activity.media_count ?? activity.media?.length ?? 0;

    return (
        <article
            className={`group relative bg-white rounded-2xl border border-[#DCE1EC] overflow-hidden flex hover:border-[#101E58]/40 hover:-translate-y-0.5 transition-all duration-300 ${
                isList ? 'flex-col sm:flex-row' : 'flex-col'
            }`}
            style={{ contentVisibility: 'auto', containIntrinsicSize: isList ? '0 220px' : '0 420px' }}
        >
            {/* Whole card is the link; admin buttons sit above it */}
            <Link
                to={`/activities/${activity.id}`}
                className="absolute inset-0 z-[1]"
                aria-label={activityTitle(activity, lang)}
            />

            <div className={`relative overflow-hidden bg-[#E7EAF4] flex-shrink-0 ${isList ? 'sm:w-72 aspect-[4/3] sm:aspect-auto' : 'aspect-[4/3]'}`}>
                <Cover activity={activity} lang={lang} priority={priority} />
                {status && (
                    <span className={`absolute top-3 start-3 px-3 py-1 text-xs font-bold text-white rounded-full ${status.cls}`}>
                        {lang === 'en' ? status.en : status.ar}
                    </span>
                )}
                {mediaCount > 1 && (
                    <span className="absolute bottom-3 end-3 inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-white bg-black/60 rounded-full">
                        <ImageIcon className="w-3.5 h-3.5" /> {mediaCount}
                    </span>
                )}
            </div>

            <div className="p-5 flex-1 flex flex-col gap-3 min-w-0">
                {date && (
                    <div className="flex items-center gap-2 text-xs text-[#5E6987]">
                        <Calendar className="w-4 h-4 text-[#E03A6F] flex-shrink-0" />
                        <span>{date}</span>
                    </div>
                )}
                <h3 className="text-lg font-bold text-[#101E58] leading-snug line-clamp-2 group-hover:text-[#E03A6F] transition-colors font-droid-arabic-kufi">
                    {activityTitle(activity, lang)}
                </h3>
                <p className={`text-sm text-[#5E6987] leading-relaxed font-droid-arabic-kufi ${isList ? 'line-clamp-3' : 'line-clamp-3'}`}>
                    {activityExcerpt(activity, lang)}
                </p>

                <div className="mt-auto pt-3 flex items-center justify-between gap-3 text-xs text-[#5E6987]">
                    <div className="flex items-center gap-4 min-w-0">
                        {activity.location && (
                            <span className="inline-flex items-center gap-1 min-w-0">
                                <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                                <span className="truncate">{activity.location}</span>
                            </span>
                        )}
                        {activity.beneficiaries_count > 0 && (
                            <span className="inline-flex items-center gap-1 flex-shrink-0">
                                <Users className="w-3.5 h-3.5" /> {activity.beneficiaries_count}
                            </span>
                        )}
                    </div>
                    <span className="inline-flex items-center gap-1 font-semibold text-[#101E58] group-hover:text-[#E03A6F] flex-shrink-0">
                        {lang === 'en' ? 'Read more' : 'اقرأ المزيد'}
                        <ArrowRight className="w-4 h-4 rtl:rotate-180 transition-transform group-hover:translate-x-1 rtl:group-hover:-translate-x-1" />
                    </span>
                </div>
            </div>

            {onEdit && (
                <div className="absolute top-3 end-3 z-[2] flex gap-2">
                    <button
                        onClick={(e) => onEdit(activity, e)}
                        className="p-2 bg-white text-blue-600 rounded-lg shadow hover:bg-blue-50"
                        aria-label={lang === 'en' ? 'Edit' : 'تعديل'}
                    >
                        <Edit className="w-4 h-4" />
                    </button>
                    <button
                        onClick={(e) => onDelete(activity.id, e)}
                        className="p-2 bg-white text-red-600 rounded-lg shadow hover:bg-red-50"
                        aria-label={lang === 'en' ? 'Delete' : 'حذف'}
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            )}
        </article>
    );
}

export default memo(ActivityCard);
