import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useLanguage } from '../../../../Context/LanguageContext';
import { typeImageUrl } from '../../../../utils/publicApi';

const plain = (html = '') => html.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();

// Entry point to the public activities: one card per category, straight from the home page
export default function ActivityCategories({ types }) {
    const { language } = useLanguage();
    const lang = language === 'en' ? 'en' : 'ar';
    const t = (en, ar) => (lang === 'en' ? en : ar);

    if (!types?.length) return null;

    return (
        <section className="py-16 md:py-24 bg-white" id="activities">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="max-w-2xl mx-auto text-center mb-12">
                    <span className="inline-block px-4 py-1.5 rounded-full bg-[#101E58]/10 text-[#101E58] text-sm font-semibold font-droid-arabic-kufi mb-4">
                        {t('What we do', 'ماذا نقدّم')}
                    </span>
                    <h2 className="text-3xl md:text-4xl font-bold text-[#101E58] font-droid-arabic-kufi mb-4">
                        {t('Our activities', 'أنشطتنا')}
                    </h2>
                    <p className="text-[#5E6987] font-droid-arabic-kufi leading-relaxed">
                        {t('Explore the work of the foundation by field and follow what we achieve on the ground.', 'تعرّف على أعمال المؤسسة حسب المجال، وتابع ما ننجزه على أرض الواقع.')}
                    </p>
                </div>

                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {types.map((type) => {
                        const name = lang === 'en' ? type.name_en : type.name_ar;
                        const text = plain(lang === 'en' ? type.description_en : type.description_ar);
                        return (
                            <Link
                                key={type.id}
                                to={`/activities/type/${type.id}`}
                                className="group relative flex flex-col bg-white rounded-2xl border border-[#DCE1EC] overflow-hidden hover:border-[#101E58]/40 hover:-translate-y-1 transition-all duration-300"
                                style={{ contentVisibility: 'auto', containIntrinsicSize: '0 380px' }}
                            >
                                <div className="aspect-[16/10] overflow-hidden bg-[#E7EAF4]">
                                    <img
                                        src={typeImageUrl(type)}
                                        alt=""
                                        loading="lazy"
                                        decoding="async"
                                        width="640"
                                        height="400"
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                        onError={(e) => {
                                            e.currentTarget.onerror = null;
                                            e.currentTarget.src = '/tagemi_consept-800.webp';
                                        }}
                                    />
                                </div>
                                <div className="p-6 flex-1 flex flex-col gap-3">
                                    <h3 className="text-xl font-bold text-[#101E58] group-hover:text-[#E03A6F] transition-colors font-droid-arabic-kufi">{name}</h3>
                                    {text && <p className="text-sm text-[#5E6987] leading-relaxed line-clamp-3 font-droid-arabic-kufi">{text}</p>}
                                    <span className="mt-auto pt-2 inline-flex items-center gap-2 text-sm font-semibold text-[#101E58] group-hover:text-[#E03A6F] font-droid-arabic-kufi">
                                        {t('See activities', 'شاهد الأنشطة')}
                                        <ArrowRight className="w-4 h-4 rtl:rotate-180 transition-transform group-hover:translate-x-1 rtl:group-hover:-translate-x-1" />
                                    </span>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
