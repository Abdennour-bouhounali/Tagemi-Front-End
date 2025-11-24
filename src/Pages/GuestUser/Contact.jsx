import React, { useEffect, useState } from 'react';
import { useLanguage } from '../../Context/LanguageContext';
import Footer from './HomePage/Components/Footer';
import {
    User,
    Phone,
    MapPin,
    MessageSquare,
    Send,
    CheckCircle,
    AlertCircle,
    Loader,
    Mail,
    Building,
    FileText
} from 'lucide-react';
import { Input, Select, Textarea } from '../Common/FormInputs';
import algeriaData from '../../data/algeria_locations.json';

const apiUrl = import.meta.env.VITE_API_URL;

const Contact = ({ project, projectName }) => {
    const { language } = useLanguage();
    const [types, setTypes] = useState([]);
    const [selectedState, setSelectedState] = useState('');
    const [selectedCommun, setSelectedCommun] = useState('');
    const [communs, setCommuns] = useState([]);
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState('');
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [touchedFields, setTouchedFields] = useState({});

    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        phone: '',
        message: project ? projectName : '',
        state: '',
        commun: '',
        type_message: project ? 'project_aide' : '',
    });

    async function getTypes() {
        try {
            const res = await fetch(`${apiUrl}/api/types`);
            const data = await res.json();
            setTypes(data);
        } catch (error) {
            console.error('Error fetching types:', error);
        }
    }

    useEffect(() => {
        getTypes();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const handleBlur = (fieldName) => {
        setTouchedFields(prev => ({ ...prev, [fieldName]: true }));
        validateField(fieldName, formData[fieldName]);
    };

    const validateField = (fieldName, value) => {
        const newErrors = { ...errors };

        switch (fieldName) {
            case 'first_name':
                if (!value.trim()) {
                    newErrors.first_name = language === 'en' ? 'First name is required' : 'الإسم مطلوب';
                } else {
                    delete newErrors.first_name;
                }
                break;
            case 'last_name':
                if (!value.trim()) {
                    newErrors.last_name = language === 'en' ? 'Last name is required' : 'اللقب مطلوب';
                } else {
                    delete newErrors.last_name;
                }
                break;
            case 'phone':
                if (!value.trim()) {
                    newErrors.phone = language === 'en' ? 'Phone number is required' : 'رقم الهاتف مطلوب';
                } else if (!/^[0-9]{10}$/.test(value.replace(/\s/g, ''))) {
                    newErrors.phone = language === 'en' ? 'Please enter a valid phone number' : 'الرجاء إدخال رقم هاتف صحيح';
                } else {
                    delete newErrors.phone;
                }
                break;
            case 'message':
                if (!project && !value.trim()) {
                    newErrors.message = language === 'en' ? 'Message is required' : 'الرسالة مطلوبة';
                } else {
                    delete newErrors.message;
                }
                break;
            case 'type_message':
                if (!project && !value) {
                    newErrors.type_message = language === 'en' ? 'Message type is required' : 'نوع الرسالة مطلوب';
                } else {
                    delete newErrors.type_message;
                }
                break;
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.first_name.trim()) {
            newErrors.first_name = language === 'en' ? 'First name is required' : 'الإسم مطلوب';
        }

        if (!formData.last_name.trim()) {
            newErrors.last_name = language === 'en' ? 'Last name is required' : 'اللقب مطلوب';
        }

        if (!formData.phone.trim()) {
            newErrors.phone = language === 'en' ? 'Phone number is required' : 'رقم الهاتف مطلوب';
        } else if (!/^[0-9]{10}$/.test(formData.phone.replace(/\s/g, ''))) {
            newErrors.phone = language === 'en' ? 'Please enter a valid phone number' : 'الرجاء إدخال رقم هاتف صحيح';
        }

        if (!selectedState) {
            newErrors.state = language === 'en' ? 'State is required' : 'الولاية مطلوبة';
        }

        if (!selectedCommun && communs.length > 0) {
            newErrors.commun = language === 'en' ? 'Commune is required' : 'البلدية مطلوبة';
        }

        if (!project && !formData.message.trim()) {
            newErrors.message = language === 'en' ? 'Message is required' : 'الرسالة مطلوبة';
        }

        if (!project && !formData.type_message) {
            newErrors.type_message = language === 'en' ? 'Message type is required' : 'نوع الرسالة مطلوب';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        setTouchedFields({
            first_name: true,
            last_name: true,
            phone: true,
            state: true,
            commun: true,
            message: true,
            type_message: true
        });

        if (!validateForm()) {
            return;
        }

        setLoading(true);
        const headers = new Headers();
        headers.append('Content-Type', 'application/json');
        headers.append('Accept', 'application/json');

        const submitData = {
            ...formData,
            state: selectedState,
            commun: selectedCommun
        };
        

        try {
            const response = await fetch(`${apiUrl}/api/contacts`, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(submitData)
            });

            if (response.ok) {
                const data = await response.json();
                setMessage(data['message'] || (language === 'en' ? 'Message sent successfully!' : 'تم إرسال الرسالة بنجاح!'));
                setMessageType('success');

                setFormData({
                    first_name: '',
                    last_name: '',
                    phone: '',
                    message: project ? projectName : '',
                    state: '',
                    commun: '',
                    type_message: project ? 'project_aide' : '',
                });
                setSelectedState('');
                setSelectedCommun('');
                setCommuns([]);
                setTouchedFields({});
                setErrors({});

                setTimeout(() => {
                    setMessage('');
                }, 7000);

                window.scrollTo({ top: 0, behavior: 'smooth' });
            } else {
                const errorData = await response.json();
                console.error('Server error:', errorData);
                setMessageType('error');
                setMessage(language === 'en' ? 'An error occurred. Please try again.' : 'حدث خطأ. يرجى المحاولة مرة أخرى.');
            }
        } catch (error) {
            console.error('Request error:', error);
            setMessageType('error');
            setMessage(language === 'en' ? 'An error occurred. Please try again.' : 'حدث خطأ. يرجى المحاولة مرة أخرى.');
        } finally {
            setLoading(false);
        }
    };

    const handleStateChange = (e) => {
        const value = e.target.value;
        setSelectedState(value);
        setSelectedCommun('');
        
        // Find the selected state and get its communes
        const state = algeriaData.algeria_locations.find(w => 
            language === 'en' ? w.name_en === value : w.name_ar === value
        );
        
        if (state) {
            setCommuns(state.communes);
        } else {
            setCommuns([]);
        }
        
        handleChange(e);
        handleBlur('state');
    };

    const handleCommunChange = (e) => {
        const value = e.target.value;
        setSelectedCommun(value);
        handleChange(e);
        handleBlur('commun');
    };

    // Get states for dropdown
    const statesOptions = algeriaData.algeria_locations.map(w => ({
        value: language === 'en' ? w.name_en : w.name_ar,
        label: language === 'en' ? w.name_en : w.name_ar
    }));

    // Get communes for dropdown
    const communsOptions = communs.map(c => ({
        value: c,
        label: c
    }));

    // Message type options
    const messageTypeOptions = [
        { value: 'project_aide', label: language === 'en' ? 'Project Assistance' : 'مساعدة في مشروع' },
        { value: 'aide', label: language === 'en' ? 'Ask Help' : 'طلب مساعدة' },
        { value: 'question', label: language === 'en' ? 'Question' : 'استفسار' },
        { value: 'other', label: language === 'en' ? 'Other' : 'أخرى' }
    ];

    return (
        <>
            <div className={`${project ? 'min-h-fit' : 'min-h-screen'} bg-gradient-to-b from-blue-50 via-white to-blue-50`}>
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16 lg:py-20">
                    {/* Success/Error Message */}
                    {message && (
                        <div className={`mb-8 rounded-2xl shadow-lg overflow-hidden animate-slide-down ${
                            messageType === 'success'
                                ? 'bg-green-50 border-r-4 border-green-500'
                                : 'bg-red-50 border-r-4 border-red-500'
                        }`}>
                            <div className="p-6">
                                <div className="flex items-start gap-4 flex-row-reverse">
                                    <div className={`flex-shrink-0 p-3 rounded-full ${
                                        messageType === 'success' ? 'bg-green-100' : 'bg-red-100'
                                    }`}>
                                        {messageType === 'success' ? (
                                            <CheckCircle className={`w-6 h-6 ${messageType === 'success' ? 'text-green-600' : 'text-red-600'}`} />
                                        ) : (
                                            <AlertCircle className="w-6 h-6 text-red-600" />
                                        )}
                                    </div>
                                    <div className="flex-1 text-right">
                                        <h3 className={`text-lg font-bold font-droid-arabic-kufi mb-1 ${
                                            messageType === 'success' ? 'text-green-800' : 'text-red-800'
                                        }`}>
                                            {messageType === 'success'
                                                ? (language === 'en' ? 'Success!' : 'نجح!')
                                                : (language === 'en' ? 'Error!' : 'خطأ!')
                                            }
                                        </h3>
                                        <p className={`font-droid-arabic-kufi ${
                                            messageType === 'success' ? 'text-green-700' : 'text-red-700'
                                        }`}>
                                            {message}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Header */}
                    <div className="text-center mb-12 animate-fade-in">
                        <div className="inline-block bg-gradient-to-r from-[#101E58] to-[#1a2d78] p-4 rounded-full mb-6">
                            <MessageSquare className="w-12 h-12 text-white" />
                        </div>
                        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-4 gradient-text font-droid-arabic-kufi">
                            {project
                                ? (language === 'en' ? 'Contribute to this Project' : 'ساهم في تجسيد هذا المشروع')
                                : (language === 'en' ? 'Contact Us' : 'تواصل معنا')}
                        </h1>
                        <div className="w-20 h-1 bg-[#E03A6F] mx-auto mb-4"></div>
                        <p className="text-xl md:text-2xl text-[#E03A6F] font-semibold font-droid-arabic-kufi">
                            {language === 'en' ? "Let's work together for an eternal life" : 'لنعمل سويا من أجل حياة أبدية'}
                        </p>
                    </div>

                    {/* Form */}
                    <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-12 border border-gray-100 animate-scale-in">
                        <form className="space-y-6" onSubmit={handleSubmit}>
                            {/* Name Fields */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <Input
                                    icon={User}
                                    label={language === 'en' ? 'First Name' : 'الإسم'}
                                    name="first_name"
                                    value={formData.first_name}
                                    onChange={handleChange}
                                    placeholder={language === 'en' ? 'Enter your first name' : 'أدخل اسمك'}
                                    required
                                    error={touchedFields.first_name && errors.first_name}
                                />
                                <Input
                                    icon={User}
                                    label={language === 'en' ? 'Last Name' : 'اللقب'}
                                    name="last_name"
                                    value={formData.last_name}
                                    onChange={handleChange}
                                    placeholder={language === 'en' ? 'Enter your last name' : 'أدخل لقبك'}
                                    required
                                    error={touchedFields.last_name && errors.last_name}
                                />
                            </div>

                            {/* Phone and State */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <Input
                                    icon={Phone}
                                    label={language === 'en' ? 'Phone Number (WhatsApp)' : 'رقم الهاتف (الواتساب)'}
                                    name="phone"
                                    type="tel"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    placeholder="0555123456"
                                    required
                                    error={touchedFields.phone && errors.phone}
                                />
                                <Select
                                    icon={MapPin}
                                    label={language === 'en' ? 'State' : 'الولاية'}
                                    name="state"
                                    value={selectedState}
                                    onChange={handleStateChange}
                                    options={statesOptions}
                                    placeholder={language === 'en' ? 'Select State' : 'اختر الولاية'}
                                    required
                                    error={touchedFields.state && errors.state}
                                />
                            </div>

                            {/* Commun */}
                            {communs.length > 0 && (
                                <div className="animate-fade-in">
                                    <Select
                                        icon={Building}
                                        label={language === 'en' ? 'Commune' : 'البلدية'}
                                        name="commun"
                                        value={selectedCommun}
                                        onChange={handleCommunChange}
                                        options={communsOptions}
                                        placeholder={language === 'en' ? 'Select Commune' : 'اختر البلدية'}
                                        required
                                        error={touchedFields.commun && errors.commun}
                                    />
                                </div>
                            )}

                            {/* Message (only if not project) */}
                            {!project && (
                                <Textarea
                                    icon={FileText}
                                    label={language === 'en' ? 'Message' : 'الرسالة'}
                                    name="message"
                                    value={formData.message}
                                    onChange={handleChange}
                                    placeholder={language === 'en' ? 'Write your message here...' : 'اكتب رسالتك هنا...'}
                                    required
                                    rows={5}
                                    error={touchedFields.message && errors.message}
                                />
                            )}

                            {/* Message Type (only if not project) */}
                            {!project && (
                                <Select
                                    icon={Mail}
                                    label={language === 'en' ? 'Message Type' : 'نوع الرسالة'}
                                    name="type_message"
                                    value={formData.type_message}
                                    onChange={handleChange}
                                    options={messageTypeOptions}
                                    placeholder={language === 'en' ? 'Select Message Type' : 'اختر نوع الرسالة'}
                                    required
                                    error={touchedFields.type_message && errors.type_message}
                                />
                            )}

                            {/* Submit Button */}
                            <div className="pt-4">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="group relative w-full px-8 py-4 bg-gradient-to-r from-[#E03A6F] to-[#c8102e] text-white text-lg font-bold rounded-full transition-all duration-300 hover:shadow-2xl hover:scale-105 transform disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 font-droid-arabic-kufi overflow-hidden"
                                >
                                    <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></span>

                                    <span className="relative flex items-center justify-center gap-3">
                                        {loading ? (
                                            <>
                                                <Loader className="w-5 h-5 animate-spin" />
                                                {language === 'en' ? 'Sending...' : 'جاري الإرسال...'}
                                            </>
                                        ) : (
                                            <>
                                                <Send className="w-5 h-5" />
                                                {language === 'en' ? 'Submit' : 'إرسال'}
                                            </>
                                        )}
                                    </span>
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Contact Info Cards */}
                    {!project && (
                        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in">
                            <div className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 text-right">
                                <div className="bg-[#E03A6F]/10 w-12 h-12 rounded-full flex items-center justify-center mb-4 mr-auto">
                                    <Phone className="w-6 h-6 text-[#E03A6F]" />
                                </div>
                                <h3 className="text-lg font-bold mb-2 font-droid-arabic-kufi text-gray-900">
                                    {language === 'en' ? 'Phone' : 'الهاتف'}
                                </h3>
                                <p className="text-gray-600 font-droid-arabic-kufi" dir="ltr">029 254 300 / 0549 88 54 59</p>
                            </div>

                            <div className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 text-right">
                                <div className="bg-[#E03A6F]/10 w-12 h-12 rounded-full flex items-center justify-center mb-4 mr-auto">
                                    <Mail className="w-6 h-6 text-[#E03A6F]" />
                                </div>
                                <h3 className="text-lg font-bold mb-2 font-droid-arabic-kufi text-gray-900">
                                    {language === 'en' ? 'Email' : 'البريد الإلكتروني'}
                                </h3>
                                <p className="text-gray-600 font-droid-arabic-kufi" dir="ltr">tagem.ass@gmail.com</p>
                            </div>

                            <div className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 text-right">
                                <div className="bg-[#E03A6F]/10 w-12 h-12 rounded-full flex items-center justify-center mb-4 mr-auto">
                                    <MapPin className="w-6 h-6 text-[#E03A6F]" />
                                </div>
                                <h3 className="text-lg font-bold mb-2 font-droid-arabic-kufi text-gray-900">
                                    {language === 'en' ? 'Location' : 'الموقع'}
                                </h3>
                                <p className="text-gray-600 font-droid-arabic-kufi">
                                    {language === 'en' ? 'El Atteuf, Ghardaia, Algeria' : 'العطف، غرداية، الجزائر'}
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <Footer types={types} />

            <style>{`
                @keyframes fade-in {
                    from {
                        opacity: 0;
                        transform: translateY(10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                @keyframes scale-in {
                    from {
                        opacity: 0;
                        transform: scale(0.95);
                    }
                    to {
                        opacity: 1;
                        transform: scale(1);
                    }
                }

                @keyframes slide-down {
                    from {
                        opacity: 0;
                        transform: translateY(-20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                .animate-fade-in {
                    animation: fade-in 0.5s ease-out;
                }

                .animate-scale-in {
                    animation: scale-in 0.5s ease-out;
                }

                .animate-slide-down {
                    animation: slide-down 0.5s ease-out;
                }

                .gradient-text {
                    background: linear-gradient(135deg, #101E58 0%, #E03A6F 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                }
            `}</style>
        </>
    );
};

export default Contact;