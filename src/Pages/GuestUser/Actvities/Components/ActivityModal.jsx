import { useState, useEffect } from 'react';
import { X, Upload, Trash2, Calendar, Video, MapPin } from 'lucide-react';
import { useLanguage } from '../../../../Context/LanguageContext';
import { useTranslation } from 'react-i18next';
import ReactQuill from 'react-quill';
import { API_BASE_URL } from '../../../../config/environment';
import 'react-quill/dist/quill.snow.css';

const apiUrl = API_BASE_URL;

const ActivityModal = ({ isOpen, onClose, activity, typeId, onSuccess, token }) => {
    const { language } = useLanguage();
    const { t } = useTranslation();
    const [formData, setFormData] = useState({
        type_id: typeId || '',
        title_en: '',
        title_ar: '',
        description_en: '',
        description_ar: '',
        location: '',
        event_date: '',
        event_end_date: '', // NEW FIELD

        status: 'upcoming',
        participants_count: 0,
        beneficiaries_count: 0,
        featured: false,
        media: []
    });
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [mediaFiles, setMediaFiles] = useState([]);
    const [mediaPreview, setMediaPreview] = useState([]);

    // Helper function to get correct media URL
    const getMediaUrl = (url) => {
        if (!url) return '/tagemi_consept.png';

        // If it's a blob URL (for newly uploaded files), return as is
        if (url.startsWith('blob:') || url.startsWith('data:')) {
            return url;
        }

        // Remove any leading slashes
        url = url.replace(/^\/+/, '');

        // If URL already starts with 'storage/', just prepend apiUrl
        if (url.startsWith('storage/')) {
            return `${apiUrl}/${url}`;
        }

        // Otherwise, add 'storage/' prefix
        return `${apiUrl}/storage/${url}`;
    };

    // Quill modules configuration for rich text editing
    const modules = {
        toolbar: [
            [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
            [{ 'font': [] }],
            [{ 'size': ['small', false, 'large', 'huge'] }],
            ['bold', 'italic', 'underline', 'strike'],
            [{ 'color': [] }, { 'background': [] }],
            [{ 'script': 'sub' }, { 'script': 'super' }],
            [{ 'list': 'ordered' }, { 'list': 'bullet' }],
            [{ 'indent': '-1' }, { 'indent': '+1' }],
            [{ 'direction': 'rtl' }],
            [{ 'align': [] }],
            ['blockquote', 'code-block'],
            ['link'],
            ['clean']
        ],
    };

    // Quill formats
    const formats = [
        'header', 'font', 'size',
        'bold', 'italic', 'underline', 'strike',
        'color', 'background',
        'script',
        'list', 'bullet', 'indent',
        'direction', 'align',
        'blockquote', 'code-block',
        'link'
    ];

    useEffect(() => {
        if (activity) {
            setFormData({
                type_id: activity.type_id || typeId,
                title_en: activity.title_en || '',
                title_ar: activity.title_ar || '',
                description_en: activity.description_en || '',
                description_ar: activity.description_ar || '',
                location: activity.location || '',
                event_date: formatDateForInput(activity.event_date) || '',
                event_end_date: formatDateForInput(activity.event_end_date) || '',
                status: activity.status || 'upcoming',
                participants_count: activity.participants_count || 0,
                beneficiaries_count: activity.beneficiaries_count || 0,
                featured: activity.featured || false,
                media: activity.media || []
            });
            if (activity.media && activity.media.length > 0) {
                setMediaPreview(activity.media.map(m => ({
                    url: getMediaUrl(m.url),
                    type: m.type,
                    existing: true,
                    id: m.id
                })));
            }
        } else {
            // Reset form for new activity
            setFormData({
                type_id: typeId || '',
                title_en: '',
                title_ar: '',
                description_en: '',
                description_ar: '',
                location: '',
                event_date: '',
                event_end_date: '', // NEW FIELD
                status: 'upcoming',
                participants_count: 0,
                beneficiaries_count: 0,
                featured: false,
                media: []
            });
            setMediaPreview([]);
            setMediaFiles([]);
        }
    }, [activity, typeId, isOpen]);
    // Helper function to format date for input field (YYYY-MM-DD)
    const formatDateForInput = (dateString) => {
        if (!dateString) return '';
        // Extract just the date part (YYYY-MM-DD) from datetime strings
        return dateString.split(' ')[0].split('T')[0];
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
        // Clear error for this field
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: null }));
        }
    };

    // Handle rich text editor changes
    const handleDescriptionChange = (value, name) => {
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        // Clear error for this field
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: null }));
        }
    };

    const handleMediaUpload = (e) => {
        const files = Array.from(e.target.files);
        const newMediaFiles = [...mediaFiles];
        const newMediaPreview = [...mediaPreview];

        files.forEach(file => {
            if (file.type.startsWith('image/')) {
                newMediaFiles.push({ file, type: 'image' });
                const reader = new FileReader();
                reader.onloadend = () => {
                    newMediaPreview.push({
                        url: reader.result,
                        type: 'image',
                        existing: false
                    });
                    setMediaPreview([...newMediaPreview]);
                };
                reader.readAsDataURL(file);
            } else if (file.type.startsWith('video/')) {
                newMediaFiles.push({ file, type: 'video' });
                newMediaPreview.push({
                    url: URL.createObjectURL(file),
                    type: 'video',
                    existing: false
                });
            }
        });

        setMediaFiles(newMediaFiles);
        setMediaPreview(newMediaPreview);
    };

    const removeMedia = (index) => {
        const mediaToRemove = mediaPreview[index];

        // If it's an existing media, we don't remove it from mediaFiles
        // We just mark it for deletion by removing from preview
        if (mediaToRemove.existing) {
            const newMediaPreview = mediaPreview.filter((_, i) => i !== index);
            setMediaPreview(newMediaPreview);
        } else {
            // For new uploads, remove from both arrays
            const newMediaFiles = mediaFiles.filter((_, i) => {
                // Find the corresponding index in mediaFiles for this new upload
                let newUploadIndex = -1;
                let count = -1;
                for (let j = 0; j <= index; j++) {
                    if (!mediaPreview[j].existing) {
                        count++;
                    }
                    if (j === index) {
                        newUploadIndex = count;
                    }
                }
                return i !== newUploadIndex;
            });

            const newMediaPreview = mediaPreview.filter((_, i) => i !== index);
            setMediaFiles(newMediaFiles);
            setMediaPreview(newMediaPreview);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErrors({});

        try {
            const formDataToSend = new FormData();

            // Append all form fields
            formDataToSend.append('type_id', formData.type_id);
            formDataToSend.append('title_en', formData.title_en);
            formDataToSend.append('title_ar', formData.title_ar);
            formDataToSend.append('description_en', formData.description_en || '');
            formDataToSend.append('description_ar', formData.description_ar || '');
            formDataToSend.append('location', formData.location || '');
            formDataToSend.append('event_date', formData.event_date || '');
            formDataToSend.append('event_end_date', formData.event_end_date || ''); // NEW FIELD
            formDataToSend.append('status', formData.status);
            formDataToSend.append('participants_count', formData.participants_count);
            formDataToSend.append('beneficiaries_count', formData.beneficiaries_count);
            formDataToSend.append('featured', formData.featured ? '1' : '0');

            // For UPDATE: Collect existing media IDs to delete
            if (activity && activity.media) {
                const existingMediaIds = activity.media.map(m => m.id);
                const currentMediaIds = mediaPreview
                    .filter(m => m.existing && m.id)
                    .map(m => m.id);

                const mediaToDelete = existingMediaIds.filter(id => !currentMediaIds.includes(id));

                if (mediaToDelete.length > 0) {
                    mediaToDelete.forEach((id, index) => {
                        formDataToSend.append(`delete_media[${index}]`, id);
                    });
                }
            }

            // Append NEW media files only (not existing ones)
            mediaFiles.forEach((media, index) => {
                formDataToSend.append(`media[]`, media.file);
                formDataToSend.append(`media_types[${index}]`, media.type);
            });

            // For updates, use POST with _method override (Laravel doesn't handle PUT with files well)
            const url = activity
                ? `${apiUrl}/api/activities/${activity.id}`
                : `${apiUrl}/api/activities`;

            if (activity) {
                formDataToSend.append('_method', 'PUT');
            }

            const response = await fetch(url, {
                method: 'POST', // Always POST for FormData
                headers: {
                    'Authorization': `Bearer ${token}`,
                    // Don't set Content-Type - browser will set it with boundary
                },
                body: formDataToSend
            });

            if (!response.ok) {
                const errorData = await response.json();
                if (errorData.errors) {
                    setErrors(errorData.errors);
                }
                throw new Error(errorData.message || 'Failed to save activity');
            }

            const data = await response.json();
            onSuccess(data.data || data);
            onClose();
        } catch (error) {
            console.error('Error saving activity:', error);
            alert(error.message || 'Failed to save activity');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
                {/* Header */}
                <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center z-10">
                    <h2 className="text-2xl font-bold text-[#101E58] font-droid-arabic-kufi">
                        {activity
                            ? t('activityModal.editActivity')
                            : t('activityModal.addNewActivity')
                        }
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Title Fields */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2 font-droid-arabic-kufi">
                                {t('activityModal.titleEnglish')}
                                <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                name="title_en"
                                value={formData.title_en}
                                onChange={handleChange}
                                required
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#E03A6F] focus:border-transparent"
                            />
                            {errors.title_en && (
                                <p className="text-red-500 text-sm mt-1">{errors.title_en[0]}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2 font-droid-arabic-kufi">
                                {t('activityModal.titleArabic')}
                                <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                name="title_ar"
                                value={formData.title_ar}
                                onChange={handleChange}
                                required
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#E03A6F] focus:border-transparent text-right"
                                dir="rtl"
                            />
                            {errors.title_ar && (
                                <p className="text-red-500 text-sm mt-1">{errors.title_ar[0]}</p>
                            )}
                        </div>
                    </div>

                    {/* Description Fields with Rich Text Editor */}
                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2 font-droid-arabic-kufi">
                                {t('activityModal.descriptionEnglish')}
                            </label>
                            <div className="border border-gray-300 rounded-lg overflow-hidden">
                                <ReactQuill
                                    theme="snow"
                                    value={formData.description_en}
                                    onChange={(value) => handleDescriptionChange(value, 'description_en')}
                                    modules={modules}
                                    formats={formats}
                                    placeholder="Write a detailed description in English..."
                                    className="bg-white"
                                    style={{ minHeight: '300px' }}
                                />
                            </div>
                            {errors.description_en && (
                                <p className="text-red-500 text-sm mt-1">{errors.description_en[0]}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2 font-droid-arabic-kufi">
                                {t('activityModal.descriptionArabic')}
                            </label>
                            <div className="border border-gray-300 rounded-lg overflow-hidden" dir="rtl">
                                <ReactQuill
                                    theme="snow"
                                    value={formData.description_ar}
                                    onChange={(value) => handleDescriptionChange(value, 'description_ar')}
                                    modules={modules}
                                    formats={formats}
                                    placeholder="اكتب وصفاً تفصيلياً بالعربية..."
                                    className="bg-white"
                                    style={{ minHeight: '300px', direction: 'rtl' }}
                                />
                            </div>
                            {errors.description_ar && (
                                <p className="text-red-500 text-sm mt-1">{errors.description_ar[0]}</p>
                            )}
                        </div>
                    </div>

                    {/* Location Field - NEW */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2 font-droid-arabic-kufi items-center gap-2">
                            <MapPin className="w-4 h-4" />
                            {t('activityModal.location')}
                        </label>
                        <input
                            type="text"
                            name="location"
                            value={formData.location}
                            onChange={handleChange}
                            placeholder={t('activityModal.locationPlaceholder')}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#E03A6F] focus:border-transparent"
                        />
                        {errors.location && (
                            <p className="text-red-500 text-sm mt-1">{errors.location[0]}</p>
                        )}
                    </div>

                    {/* Location, Date, Status */}
                    {/* Date Fields - NOW WITH END DATE */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2 items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                {t('activityModal.startDate')}
                            </label>
                            <input
                                type="date"
                                name="event_date"
                                value={formData.event_date}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#E03A6F] focus:border-transparent"
                            />
                            {errors.event_date && (
                                <p className="text-red-500 text-sm mt-1">{errors.event_date[0]}</p>
                            )}
                        </div>

                        {/* NEW: End Date Field */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2 items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                {t('activityModal.endDate')}
                            </label>
                            <input
                                type="date"
                                name="event_end_date"
                                value={formData.event_end_date}
                                onChange={handleChange}
                                min={formData.event_date}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#E03A6F] focus:border-transparent"
                            />
                            {errors.event_end_date && (
                                <p className="text-red-500 text-sm mt-1">{errors.event_end_date[0]}</p>
                            )}
                            {formData.event_date && formData.event_end_date && (
                                <p className="text-xs text-gray-500 mt-1">
                                    {t('activityModal.duration')}: {Math.ceil((new Date(formData.event_end_date) - new Date(formData.event_date)) / (1000 * 60 * 60 * 24)) + 1} {t('activityModal.days')}
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                {t('activityModal.status')}<span className="text-red-500">*</span>
                            </label>
                            <select
                                name="status"
                                value={formData.status}
                                onChange={handleChange}
                                required
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#E03A6F] focus:border-transparent"
                            >
                                <option value="upcoming">{t('activityModal.upcoming')}</option>
                                <option value="ongoing">{t('activityModal.ongoing')}</option>
                                <option value="completed">{t('activityModal.completed')}</option>
                                <option value="cancelled">{t('activityModal.cancelled')}</option>
                            </select>
                        </div>
                    </div>

                    {/* Counts */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2 font-droid-arabic-kufi">
                                {t('activityModal.participantsCount')}
                            </label>
                            <input
                                type="number"
                                name="participants_count"
                                value={formData.participants_count}
                                onChange={handleChange}
                                min="0"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#E03A6F] focus:border-transparent"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2 font-droid-arabic-kufi">
                                {t('activityModal.beneficiariesCount')}
                            </label>
                            <input
                                type="number"
                                name="beneficiaries_count"
                                value={formData.beneficiaries_count}
                                onChange={handleChange}
                                min="0"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#E03A6F] focus:border-transparent"
                            />
                        </div>
                    </div>

                    {/* Featured Checkbox */}
                    <div className="flex items-center">
                        <input
                            type="checkbox"
                            name="featured"
                            id="featured"
                            checked={formData.featured}
                            onChange={handleChange}
                            className="w-4 h-4 text-[#E03A6F] border-gray-300 rounded focus:ring-[#E03A6F]"
                        />
                        <label htmlFor="featured" className="ml-2 text-sm font-medium text-gray-700 font-droid-arabic-kufi">
                            {t('activityModal.featuredActivity')}
                        </label>
                    </div>

                    {/* Media Upload */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2 font-droid-arabic-kufi">
                            {t('activityModal.media')}
                        </label>

                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-[#E03A6F] transition-colors">
                            <input
                                type="file"
                                multiple
                                accept="image/*,video/*"
                                onChange={handleMediaUpload}
                                className="hidden"
                                id="media-upload"
                            />
                            <label
                                htmlFor="media-upload"
                                className="cursor-pointer flex flex-col items-center"
                            >
                                <Upload className="w-12 h-12 text-gray-400 mb-2" />
                                <span className="text-sm text-gray-600 font-droid-arabic-kufi">
                                    {t('activityModal.clickToUpload')}
                                </span>
                                <span className="text-xs text-gray-500 mt-1">
                                    {t('activityModal.imagesAndVideos')}
                                </span>
                            </label>
                        </div>

                        {/* Media Preview */}
                        {mediaPreview.length > 0 && (
                            <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                {mediaPreview.map((media, index) => (
                                    <div key={index} className="relative group">
                                        <div className="aspect-video rounded-lg overflow-hidden bg-gray-200">
                                            {media.type === 'image' ? (
                                                <img
                                                    src={media.url}
                                                    alt={`Media ${index + 1}`}
                                                    className="w-full h-full object-cover"
                                                    onError={(e) => {
                                                        console.error('Preview image failed to load:', e.target.src);
                                                        e.target.src = '/tagemi_consept.png';
                                                    }}
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <Video className="w-8 h-8 text-gray-400" />
                                                </div>
                                            )}
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => removeMedia(index)}
                                            className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-droid-arabic-kufi"
                        >
                            {t('common.cancel')}
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-6 py-2 bg-[#E03A6F] text-white rounded-lg hover:bg-[#c8102e] transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-droid-arabic-kufi flex items-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                    {t('activityModal.saving')}
                                </>
                            ) : (
                                t('activityModal.saveActivity')
                            )}
                        </button>
                    </div>
                </form>
            </div>

            {/* Custom CSS for Quill Editor */}
            <style jsx global>{`
                .ql-container {
                    min-height: 250px;
                    font-family: inherit;
                }
                
                .ql-editor {
                    min-height: 250px;
                    font-size: 15px;
                    line-height: 1.6;
                }
                
                .ql-editor.ql-blank::before {
                    font-style: normal;
                    color: #9ca3af;
                }
                
                /* RTL Support for Arabic */
                .ql-editor[dir="rtl"] {
                    text-align: right;
                }
                
                /* Toolbar styling */
                .ql-toolbar {
                    background-color: #f9fafb;
                    border-bottom: 1px solid #e5e7eb !important;
                    border-top-left-radius: 0.5rem;
                    border-top-right-radius: 0.5rem;
                }
                
                .ql-container {
                    border-bottom-left-radius: 0.5rem;
                    border-bottom-right-radius: 0.5rem;
                }
                
                /* Custom color for active toolbar buttons */
                .ql-toolbar button:hover,
                .ql-toolbar button.ql-active {
                    color: #E03A6F !important;
                }
                
                .ql-toolbar .ql-stroke {
                    stroke: #374151;
                }
                
                .ql-toolbar button:hover .ql-stroke,
                .ql-toolbar button.ql-active .ql-stroke {
                    stroke: #E03A6F !important;
                }
                
                .ql-toolbar .ql-fill {
                    fill: #374151;
                }
                
                .ql-toolbar button:hover .ql-fill,
                .ql-toolbar button.ql-active .ql-fill {
                    fill: #E03A6F !important;
                }
            `}</style>
        </div>
    );
};

export default ActivityModal;