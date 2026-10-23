import { lazy, Suspense, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowRight, Calendar, Grid3x3, List, Plus, Search, Shield, Users, X } from 'lucide-react';
import { API_BASE_URL } from '../../../config/environment';
import { useLanguage } from "../../../Context/LanguageContext";
import { AppContext } from "../../../Context/AppContext";
import { fetchTypes, typeImageUrl } from "../../../utils/publicApi";
import { sanitizeHtml } from '../../../utils/safeHtml';
import Footer from "../HomePage/Components/Footer";
import ActivityCard, { activityExcerpt, activityTitle } from "./Components/ActivityCard";

// Only content admins ever open the editor, so it stays out of the visitors' download
const ActivityModal = lazy(() => import("./Components/ActivityModal"));

const apiUrl = API_BASE_URL;
const PAGE_SIZE = 9;

const yearOf = (a) => {
    const d = a.event_date || a.created_at;
    return d ? new Date(d).getFullYear() : null;
};

const plain = (html = '') => html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

export default function Activities() {
    const { TypeId } = useParams();
    const { user, token } = useContext(AppContext);
    const { language } = useLanguage();
    const lang = language === 'en' ? 'en' : 'ar';
    const t = (en, ar) => (lang === 'en' ? en : ar);

    const [types, setTypes] = useState([]);
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [failed, setFailed] = useState(false);
    const [viewMode, setViewMode] = useState('grid');
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState('newest');
    const [selectedYear, setSelectedYear] = useState('all');
    const [visible, setVisible] = useState(PAGE_SIZE);

    // Content admin tools
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedActivity, setSelectedActivity] = useState(null);
    const [activityToDelete, setActivityToDelete] = useState(null);
    const isContentAdmin = !!user && (user.role_id === 1 || user.role_id === 7);

    const type = useMemo(() => types.find((x) => String(x.id) === String(TypeId)), [types, TypeId]);

    useEffect(() => {
        fetchTypes().then(setTypes).catch((e) => console.error('Error fetching types:', e));
    }, []);

    const loadActivities = useCallback(async (signal) => {
        try {
            setFailed(false);
            const res = await fetch(`${apiUrl}/api/activities/type/${TypeId}`, {
                signal,
                headers: { Accept: 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            setActivities(await res.json());
        } catch (error) {
            if (error.name !== 'AbortError') {
                console.error('Error fetching activities:', error);
                setFailed(true);
            }
        } finally {
            if (!signal?.aborted) setLoading(false);
        }
    }, [TypeId, token]);

    useEffect(() => {
        setLoading(true);
        setActivities([]);
        setSearchQuery('');
        setSelectedYear('all');
        setVisible(PAGE_SIZE);
        window.scrollTo({ top: 0 });
        const controller = new AbortController();
        loadActivities(controller.signal);
        return () => controller.abort();
    }, [loadActivities]);

    const years = useMemo(
        () => [...new Set(activities.map(yearOf))].filter(Boolean).sort((a, b) => b - a),
        [activities]
    );

    const totalBeneficiaries = useMemo(
        () => activities.reduce((sum, a) => sum + (Number(a.beneficiaries_count) || 0), 0),
        [activities]
    );

    const filtered = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        const list = activities.filter((a) => {
            if (selectedYear !== 'all' && String(yearOf(a)) !== String(selectedYear)) return false;
            if (!q) return true;
            return `${activityTitle(a, lang)} ${activityExcerpt(a, lang)}`.toLowerCase().includes(q);
        });
        const time = (a) => new Date(a.event_date || a.created_at || 0).getTime();
        return list.sort((a, b) => {
            if (sortBy === 'oldest') return time(a) - time(b);
            if (sortBy === 'title') return (activityTitle(a, lang) || '').localeCompare(activityTitle(b, lang) || '');
            return time(b) - time(a);
        });
    }, [activities, searchQuery, selectedYear, sortBy, lang]);

    useEffect(() => setVisible(PAGE_SIZE), [searchQuery, selectedYear, sortBy]);

    const typeName = type ? (lang === 'en' ? type.name_en : type.name_ar) : '';
    const typeDescription = type ? plain(lang === 'en' ? type.description_en : type.description_ar) : '';

    const openEditor = (activity, e) => {
        e?.preventDefault();
        e?.stopPropagation();
        setSelectedActivity(activity);
        setIsModalOpen(true);
    };

    const askDelete = (id, e) => {
        e?.preventDefault();
        e?.stopPropagation();
        setActivityToDelete(id);
    };

    const confirmDelete = async () => {
        try {
            const response = await fetch(`${apiUrl}/api/activities/${activityToDelete}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
            });
            if (!response.ok) throw new Error('delete failed');
            setActivities((list) => list.filter((a) => a.id !== activityToDelete));
        } catch (error) {
            console.error('Error deleting activity:', error);
        } finally {
            setActivityToDelete(null);
        }
    };

    const resetFilters = () => {
        setSearchQuery('');
        setSelectedYear('all');
    };

    const shown = filtered.slice(0, visible);
    const fieldCls = 'h-11 px-3 rounded-xl border border-[#DCE1EC] bg-white text-sm text-[#101E58] focus:outline-none focus:ring-2 focus:ring-[#101E58]/30 font-droid-arabic-kufi';

    return (
        <div className="min-h-screen bg-[#F2F4F9]">
            {/* Hero */}
            <section className="bg-[#101E58] text-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14 grid gap-8 lg:grid-cols-[1.2fr_1fr] items-center">
                    <div className="space-y-5">
                        <div className="flex items-center gap-2 text-sm text-white/70 font-droid-arabic-kufi" role="navigation" aria-label="breadcrumb">
                            <Link to="/" className="hover:text-white">{t('Home', 'الرئيسية')}</Link>
                            <span aria-hidden="true">/</span>
                            <span className="text-white">{typeName || t('Activities', 'الأنشطة')}</span>
                        </div>

                        {isContentAdmin && (
                            <span className="inline-flex items-center gap-2 bg-white/10 px-3 py-1 rounded-full text-xs font-droid-arabic-kufi">
                                <Shield className="w-3.5 h-3.5" /> {t('Admin mode', 'وضع المدير')}
                            </span>
                        )}

                        {type ? (
                            <h1 className="text-3xl md:text-4xl font-bold leading-tight font-droid-arabic-kufi">{typeName}</h1>
                        ) : (
                            <div className="h-10 w-2/3 rounded-lg bg-white/10 animate-pulse" />
                        )}

                        {typeDescription && (
                            <p className="text-white/80 leading-relaxed max-w-xl line-clamp-3 font-droid-arabic-kufi">{typeDescription}</p>
                        )}

                        <dl className="flex flex-wrap gap-3">
                            <div className="bg-white/10 rounded-xl px-4 py-3 min-w-[110px]">
                                <dt className="text-xs text-white/70 font-droid-arabic-kufi">{t('Activities', 'نشاط')}</dt>
                                <dd className="text-2xl font-bold">{loading ? '–' : activities.length}</dd>
                            </div>
                            {totalBeneficiaries > 0 && (
                                <div className="bg-white/10 rounded-xl px-4 py-3 min-w-[110px]">
                                    <dt className="text-xs text-white/70 font-droid-arabic-kufi">{t('Beneficiaries', 'مستفيد')}</dt>
                                    <dd className="text-2xl font-bold">{totalBeneficiaries.toLocaleString(lang === 'en' ? 'en-US' : 'ar-DZ')}</dd>
                                </div>
                            )}
                        </dl>
                    </div>

                    {type && (
                        <div className="hidden lg:block">
                            <img
                                src={typeImageUrl(type)}
                                alt={typeName}
                                fetchPriority="high"
                                decoding="async"
                                width="560"
                                height="380"
                                className="w-full h-[320px] object-cover rounded-3xl border border-white/10"
                                onError={(e) => {
                                    e.currentTarget.onerror = null;
                                    e.currentTarget.src = '/tagemi_consept-800.webp';
                                }}
                            />
                        </div>
                    )}
                </div>
            </section>

            {/* Category switcher + filters: stays under the navbar while scrolling */}
            <div className="sticky top-14 sm:top-16 lg:top-20 z-30 bg-white/95 backdrop-blur border-b border-[#DCE1EC]">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 space-y-3">
                    {types.length > 1 && (
                        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 no-scrollbar" role="tablist" aria-label={t('Categories', 'الفئات')}>
                            {types.map((x) => {
                                const active = String(x.id) === String(TypeId);
                                return (
                                    <Link
                                        key={x.id}
                                        to={`/activities/type/${x.id}`}
                                        role="tab"
                                        aria-selected={active}
                                        className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-droid-arabic-kufi transition-colors ${
                                            active ? 'bg-[#101E58] text-white' : 'bg-[#E7EAF4] text-[#101E58] hover:bg-[#d6dbed]'
                                        }`}
                                    >
                                        {lang === 'en' ? x.name_en : x.name_ar}
                                    </Link>
                                );
                            })}
                        </div>
                    )}

                    <div className="flex flex-col md:flex-row gap-3">
                        <div className="relative flex-1">
                            <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#5E6987] pointer-events-none" />
                            <input
                                type="search"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder={t('Search activities…', 'ابحث في الأنشطة…')}
                                className={`${fieldCls} w-full ps-10 pe-10`}
                            />
                            {searchQuery && (
                                <button onClick={() => setSearchQuery('')} className="absolute end-3 top-1/2 -translate-y-1/2 text-[#5E6987]" aria-label={t('Clear', 'مسح')}>
                                    <X className="w-4 h-4" />
                                </button>
                            )}
                        </div>

                        <div className="flex gap-2 flex-wrap">
                            {years.length > 1 && (
                                <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} className={fieldCls} aria-label={t('Year', 'السنة')}>
                                    <option value="all">{t('All years', 'كل السنوات')}</option>
                                    {years.map((y) => <option key={y} value={y}>{y}</option>)}
                                </select>
                            )}
                            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className={fieldCls} aria-label={t('Sort', 'ترتيب')}>
                                <option value="newest">{t('Newest first', 'الأحدث أولاً')}</option>
                                <option value="oldest">{t('Oldest first', 'الأقدم أولاً')}</option>
                                <option value="title">{t('By title', 'حسب العنوان')}</option>
                            </select>
                            <div className="hidden sm:flex rounded-xl border border-[#DCE1EC] overflow-hidden bg-white">
                                {[['grid', Grid3x3, t('Grid', 'شبكة')], ['list', List, t('List', 'قائمة')]].map(([mode, Icon, label]) => (
                                    <button
                                        key={mode}
                                        onClick={() => setViewMode(mode)}
                                        aria-label={label}
                                        aria-pressed={viewMode === mode}
                                        className={`w-11 h-11 flex items-center justify-center ${viewMode === mode ? 'bg-[#101E58] text-white' : 'text-[#5E6987] hover:bg-[#F2F4F9]'}`}
                                    >
                                        <Icon className="w-5 h-5" />
                                    </button>
                                ))}
                            </div>
                            {isContentAdmin && (
                                <button
                                    onClick={() => openEditor(null)}
                                    className="h-11 px-4 rounded-xl bg-[#E03A6F] text-white flex items-center gap-2 text-sm font-droid-arabic-kufi hover:bg-[#c8102e]"
                                >
                                    <Plus className="w-5 h-5" />
                                    <span className="hidden sm:inline">{t('Add activity', 'إضافة نشاط')}</span>
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Results */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
                {!loading && !failed && activities.length > 0 && (
                    <p className="mb-5 text-sm text-[#5E6987] font-droid-arabic-kufi" aria-live="polite">
                        {t(`Showing ${shown.length} of ${filtered.length}`, `عرض ${shown.length} من ${filtered.length}`)}
                    </p>
                )}

                {loading ? (
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3" aria-hidden="true">
                        {[0, 1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className="bg-white rounded-2xl border border-[#DCE1EC] overflow-hidden animate-pulse">
                                <div className="aspect-[4/3] bg-[#E7EAF4]" />
                                <div className="p-5 space-y-3">
                                    <div className="h-3 w-1/3 bg-[#E7EAF4] rounded" />
                                    <div className="h-5 w-4/5 bg-[#E7EAF4] rounded" />
                                    <div className="h-3 w-full bg-[#E7EAF4] rounded" />
                                    <div className="h-3 w-2/3 bg-[#E7EAF4] rounded" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : failed ? (
                    <div className="text-center py-20">
                        <p className="text-[#101E58] font-bold text-lg mb-4 font-droid-arabic-kufi">{t("Couldn't load the activities", 'تعذّر تحميل الأنشطة')}</p>
                        <button onClick={() => { setLoading(true); loadActivities(); }} className="px-6 py-3 rounded-full bg-[#101E58] text-white font-droid-arabic-kufi">
                            {t('Try again', 'إعادة المحاولة')}
                        </button>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="text-center py-20">
                        <Search className="w-12 h-12 mx-auto mb-4 text-[#5E6987]/60" />
                        <h2 className="text-xl font-bold text-[#101E58] mb-2 font-droid-arabic-kufi">{t('No activities found', 'لا توجد أنشطة')}</h2>
                        <p className="text-[#5E6987] mb-6 font-droid-arabic-kufi">
                            {activities.length ? t('Try a different search or year.', 'جرّب بحثاً أو سنة مختلفة.') : t('Activities will appear here soon.', 'ستظهر الأنشطة هنا قريباً.')}
                        </p>
                        {(searchQuery || selectedYear !== 'all') && (
                            <button onClick={resetFilters} className="px-6 py-3 rounded-full bg-[#E03A6F] text-white font-droid-arabic-kufi">
                                {t('Clear filters', 'مسح الفلاتر')}
                            </button>
                        )}
                    </div>
                ) : (
                    <>
                        <div className={`grid gap-6 ${viewMode === 'grid' ? 'sm:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
                            {shown.map((activity, i) => (
                                <ActivityCard
                                    key={activity.id}
                                    activity={activity}
                                    lang={lang}
                                    layout={viewMode}
                                    priority={i < 3}
                                    onEdit={isContentAdmin ? openEditor : undefined}
                                    onDelete={isContentAdmin ? askDelete : undefined}
                                />
                            ))}
                        </div>

                        {visible < filtered.length && (
                            <div className="mt-10 text-center">
                                <button
                                    onClick={() => setVisible((v) => v + PAGE_SIZE)}
                                    className="inline-flex items-center gap-2 px-8 py-3 rounded-full border-2 border-[#101E58] text-[#101E58] font-semibold hover:bg-[#101E58] hover:text-white transition-colors font-droid-arabic-kufi"
                                >
                                    {t('Show more', 'عرض المزيد')}
                                    <ArrowRight className="w-4 h-4 rtl:rotate-180" />
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Category description (full text) */}
            {type && (lang === 'en' ? type.description_en : type.description_ar) && (
                <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-14">
                    <div className="bg-white rounded-2xl border border-[#DCE1EC] p-6 md:p-10">
                        <h2 className="text-xl md:text-2xl font-bold text-[#101E58] mb-4 font-droid-arabic-kufi">
                            {t('About this category', 'عن هذه الفئة')}
                        </h2>
                        <div
                            className="prose max-w-none text-[#2A3A7A] leading-relaxed font-droid-arabic-kufi"
                            dangerouslySetInnerHTML={{ __html: sanitizeHtml(lang === 'en' ? type.description_en : type.description_ar) }}
                        />
                    </div>
                </section>
            )}

            {/* Support strip */}
            <section className="bg-[#101E58] text-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col md:flex-row items-center justify-between gap-5 text-center md:text-start">
                    <div className="flex items-center gap-4">
                        <Users className="w-10 h-10 text-[#E03A6F] hidden sm:block" />
                        <p className="text-lg font-droid-arabic-kufi">{t('Want to be part of what we do?', 'تريد أن تكون جزءاً مما نقوم به؟')}</p>
                    </div>
                    <div className="flex gap-3">
                        <Link to="/volunteer" className="px-6 py-3 rounded-full bg-[#E03A6F] hover:bg-[#c8102e] font-semibold font-droid-arabic-kufi transition-colors">
                            {t('Volunteer', 'تطوع معنا')}
                        </Link>
                        <Link to="/contact" className="px-6 py-3 rounded-full border border-white/40 hover:bg-white/10 font-droid-arabic-kufi transition-colors">
                            {t('Contact us', 'اتصل بنا')}
                        </Link>
                    </div>
                </div>
            </section>

            {isModalOpen && (
                <Suspense fallback={null}>
                    <ActivityModal
                        isOpen={isModalOpen}
                        onClose={() => {
                            setIsModalOpen(false);
                            setSelectedActivity(null);
                        }}
                        activity={selectedActivity}
                        typeId={TypeId}
                        onSuccess={() => loadActivities()}
                        token={token}
                    />
                </Suspense>
            )}

            {activityToDelete && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
                    <div className="bg-white rounded-2xl max-w-md w-full p-6">
                        <h3 className="text-xl font-bold text-gray-900 mb-3 font-droid-arabic-kufi">{t('Confirm delete', 'تأكيد الحذف')}</h3>
                        <p className="text-gray-600 mb-6 font-droid-arabic-kufi">
                            {t('Are you sure you want to delete this activity? This cannot be undone.', 'هل أنت متأكد من حذف هذا النشاط؟ لا يمكن التراجع عن هذا الإجراء.')}
                        </p>
                        <div className="flex gap-3 justify-end">
                            <button onClick={() => setActivityToDelete(null)} className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-droid-arabic-kufi">
                                {t('Cancel', 'إلغاء')}
                            </button>
                            <button onClick={confirmDelete} className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-droid-arabic-kufi">
                                {t('Delete', 'حذف')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <Footer types={types} />
        </div>
    );
}
