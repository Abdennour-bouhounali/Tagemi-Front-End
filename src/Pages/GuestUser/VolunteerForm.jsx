import { API_BASE_URL } from '../../config/environment';
import React, { useEffect, useState, useCallback } from 'react';
import { useLanguage } from "../../Context/LanguageContext";
import { useTranslation } from 'react-i18next';
import Footer from './HomePage/Components/Footer';
import { Input, Select, Textarea, FormGroup } from '../Common/FormInputs';
import {
    User,
    Calendar,
    Phone,
    Mail,
    MapPin,
    Briefcase,
    Award,
    Heart,
    Target,
    Users,
    CheckCircle,
    Loader,
    Home,
    XCircle
} from 'lucide-react';
import algeriaLocations from '../../data/algeria_locations.json';

const apiUrl = API_BASE_URL;

const VolunteerForm = () => {
    const { language } = useLanguage();
    const { t } = useTranslation();
    const [types, setTypes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState(''); // 'success' or 'error'
    const [availableCities, setAvailableCities] = useState([]);

    const [formData, setFormData] = useState({
        full_name: '',
        date_of_birth: '',
        gender: '',
        phone_number: '',
        email_address: '',
        city: '',
        state: '',
        relevant_skills: '',
        previous_volunteering_experience: '',
        professional_background: '',
        areas_of_interest: '',
        preferred_types_of_activities: '',
        reasons_for_volunteering: ''
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });
    };

    // NEW: Handle state change
    const handleStateChange = useCallback((e) => {
        const stateName = e.target.value;
        setFormData(prev => ({
            ...prev,
            state: stateName,
            city: '' // Reset city when state changes
        }));

        // Find the selected wilaya and set its communes
        const selectedWilaya = algeriaLocations.algeria_locations.find(
            loc => loc.name_ar === stateName
        );

        if (selectedWilaya) {
            setAvailableCities(selectedWilaya.communes);
        } else {
            setAvailableCities([]);
        }
    }, []);

    async function getTypes() {
        const res = await fetch(`${apiUrl}/api/types`);
        const data = await res.json();
        setTypes(data);
    }

    useEffect(() => {
        getTypes();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');

        try {
            const response = await fetch(`${apiUrl}/api/volunteers`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                setMessageType('success');
                setMessage(t('volunteer.successMessage'));

                // Reset form
                setFormData({
                    full_name: '',
                    date_of_birth: '',
                    gender: '',
                    phone_number: '',
                    email_address: '',
                    city: '',
                    state: '',
                    relevant_skills: '',
                    previous_volunteering_experience: '',
                    professional_background: '',
                    areas_of_interest: '',
                    preferred_types_of_activities: '',
                    reasons_for_volunteering: ''
                });

                // Reset cities
                setAvailableCities([]);

                // Scroll to top to see success message
                window.scrollTo({ top: 0, behavior: 'smooth' });

                setTimeout(() => {
                    setMessage('');
                }, 5000);
            } else {
                setMessageType('error');
                setMessage(t('volunteer.errorMessage'));
            }
        } catch (error) {
            console.error('Error:', error);
            setMessageType('error');
            setMessage(t('volunteer.errorMessage'));
        } finally {
            setLoading(false);
        }
    };

    const genderOptions = [
        { value: 'Male', label: t('volunteer.male') },
        { value: 'Female', label: t('volunteer.female') }
    ];

    // Prepare state options
    const stateOptions = algeriaLocations.algeria_locations.map(loc => ({
        value: loc.name_ar,
        label: language === 'en'
            ? `${loc.name_en} - ${loc.code}`
            : `${loc.name_ar} - ${loc.code}`
    }));

    // Prepare city options based on selected state
    const cityOptions = availableCities.map(city => ({
        value: city,
        label: city
    }));

    return (
        <>
            <div className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-blue-50 py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-5xl mx-auto">
                    {/* Success/Error Message */}
                    {message && (
                        <div className={`mb-8 animate-fade-in ${messageType === 'success'
                            ? 'bg-green-50 border-r-4 border-green-500'
                            : 'bg-red-50 border-r-4 border-red-500'
                            } p-6 rounded-xl shadow-lg`}>
                            <div className="flex items-center gap-4">
                                {messageType === 'success' ? (
                                    <div className="bg-green-100 p-3 rounded-full">
                                        <CheckCircle className="w-8 h-8 text-green-600" />
                                    </div>
                                ) : (
                                    <div className="bg-red-100 p-3 rounded-full">
                                        <XCircle className="w-8 h-8 text-red-600" />
                                    </div>
                                )}
                                <div>
                                    <h3 className={`text-lg font-bold font-droid-arabic-kufi ${messageType === 'success' ? 'text-green-800' : 'text-red-800'
                                        }`}>
                                        {messageType === 'success'
                                            ? t('volunteer.success')
                                            : t('volunteer.error')
                                        }
                                    </h3>
                                    <p className={`mt-1 font-droid-arabic-kufi ${messageType === 'success' ? 'text-green-700' : 'text-red-700'
                                        }`}>
                                        {message}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Header Section */}
                    <div className="text-center mb-12 animate-fade-in-down">
                        <div className="inline-block bg-gradient-to-r from-[#101E58] to-[#1a2d78] p-4 rounded-full mb-6">
                            <Users className="w-12 h-12 text-white" />
                        </div>
                        <h1 className="text-5xl font-bold mb-4 gradient-text font-droid-arabic-kufi">
                            {t('volunteer.title')}
                        </h1>
                        <p className="text-2xl text-[#E03A6F] font-semibold font-droid-arabic-kufi mb-2">
                            {t('volunteer.subtitle')}
                        </p>
                        <p className="text-gray-600 max-w-2xl mx-auto font-droid-arabic-kufi">
                            {t('volunteer.description')}
                        </p>
                    </div>

                    {/* Form Container */}
                    <div className="bg-white rounded-2xl shadow-2xl p-8 md:p-12 border border-gray-100 animate-scale-in">
                        <form onSubmit={handleSubmit} className="space-y-10">
                            {/* Personal Information Section */}
                            <div>
                                <div className="flex items-center gap-3 mb-6 pb-4 border-b-2 border-[#101E58]/10">
                                    <div className="bg-[#101E58]/10 p-2 rounded-lg">
                                        <User className="w-6 h-6 text-[#101E58]" />
                                    </div>
                                    <h2 className="text-2xl font-bold text-[#101E58] font-droid-arabic-kufi">
                                        {t('volunteer.personalInfo')}
                                    </h2>
                                </div>

                                <FormGroup columns={2}>
                                    <Input
                                        icon={User}
                                        label={t('volunteer.fullName')}
                                        name="full_name"
                                        type="text"
                                        value={formData.full_name}
                                        onChange={handleChange}
                                        required
                                    />

                                    <Input
                                        icon={Calendar}
                                        label={t('volunteer.dateOfBirth')}
                                        name="date_of_birth"
                                        type="date"
                                        value={formData.date_of_birth}
                                        onChange={handleChange}
                                        required
                                    />

                                    <Select
                                        icon={User}
                                        label={t('volunteer.gender')}
                                        name="gender"
                                        value={formData.gender}
                                        onChange={handleChange}
                                        placeholder={t('volunteer.selectGender')}
                                        options={genderOptions}
                                        required
                                    />

                                    <Input
                                        icon={Phone}
                                        label={t('volunteer.phoneNumber')}
                                        name="phone_number"
                                        type="tel"
                                        value={formData.phone_number}
                                        onChange={handleChange}
                                        required
                                    />
                                </FormGroup>
                            </div>

                            {/* Contact Information Section */}
                            <div>
                                <div className="flex items-center gap-3 mb-6 pb-4 border-b-2 border-[#E03A6F]/10">
                                    <div className="bg-[#E03A6F]/10 p-2 rounded-lg">
                                        <MapPin className="w-6 h-6 text-[#E03A6F]" />
                                    </div>
                                    <h2 className="text-2xl font-bold text-[#E03A6F] font-droid-arabic-kufi">
                                        {t('volunteer.contactInfo')}
                                    </h2>
                                </div>

                                <FormGroup columns={1}>
                                    <Input
                                        icon={Mail}
                                        label={t('volunteer.email')}
                                        name="email_address"
                                        type="email"
                                        value={formData.email_address}
                                        onChange={handleChange}
                                        required
                                    />
                                </FormGroup>

                                <FormGroup columns={2} className="mt-4">
                                    <Select
                                        icon={MapPin}
                                        label={t('volunteer.state')}
                                        name="state"
                                        value={formData.state}
                                        onChange={handleStateChange}
                                        placeholder={t('volunteer.selectState')}
                                        options={stateOptions}
                                        required
                                    />

                                    <Select
                                        icon={Home}
                                        label={t('volunteer.city')}
                                        name="city"
                                        value={formData.city}
                                        onChange={handleChange}
                                        placeholder={
                                            formData.state
                                                ? t('volunteer.selectCity')
                                                : t('volunteer.selectStateFirst')
                                        }
                                        options={cityOptions}
                                        disabled={!formData.state || availableCities.length === 0}
                                        required
                                    />
                                </FormGroup>
                            </div>

                            {/* Professional Background Section */}
                            <div>
                                <div className="flex items-center gap-3 mb-6 pb-4 border-b-2 border-[#101E58]/10">
                                    <div className="bg-[#101E58]/10 p-2 rounded-lg">
                                        <Briefcase className="w-6 h-6 text-[#101E58]" />
                                    </div>
                                    <h2 className="text-2xl font-bold text-[#101E58] font-droid-arabic-kufi">
                                        {t('volunteer.professionalInfo')}
                                    </h2>
                                </div>

                                <div className="space-y-4">
                                    <Textarea
                                        icon={Award}
                                        label={t('volunteer.relevantSkills')}
                                        name="relevant_skills"
                                        value={formData.relevant_skills}
                                        onChange={handleChange}
                                        rows={4}
                                    />

                                    <Textarea
                                        icon={Users}
                                        label={t('volunteer.previousExperience')}
                                        name="previous_volunteering_experience"
                                        value={formData.previous_volunteering_experience}
                                        onChange={handleChange}
                                        rows={4}
                                    />

                                    <Textarea
                                        icon={Briefcase}
                                        label={t('volunteer.professionalBackground')}
                                        name="professional_background"
                                        value={formData.professional_background}
                                        onChange={handleChange}
                                        rows={4}
                                    />
                                </div>
                            </div>

                            {/* Interests & Preferences Section */}
                            <div>
                                <div className="flex items-center gap-3 mb-6 pb-4 border-b-2 border-[#E03A6F]/10">
                                    <div className="bg-[#E03A6F]/10 p-2 rounded-lg">
                                        <Heart className="w-6 h-6 text-[#E03A6F]" />
                                    </div>
                                    <h2 className="text-2xl font-bold text-[#E03A6F] font-droid-arabic-kufi">
                                        {t('volunteer.interestsPreferences')}
                                    </h2>
                                </div>

                                <div className="space-y-4">
                                    <Textarea
                                        icon={Target}
                                        label={t('volunteer.areasOfInterest')}
                                        name="areas_of_interest"
                                        value={formData.areas_of_interest}
                                        onChange={handleChange}
                                        rows={4}
                                    />

                                    <Textarea
                                        icon={Award}
                                        label={t('volunteer.preferredActivities')}
                                        name="preferred_types_of_activities"
                                        value={formData.preferred_types_of_activities}
                                        onChange={handleChange}
                                        rows={4}
                                    />

                                    <Textarea
                                        icon={Heart}
                                        label={t('volunteer.reasonsForVolunteering')}
                                        name="reasons_for_volunteering"
                                        value={formData.reasons_for_volunteering}
                                        onChange={handleChange}
                                        rows={4}
                                    />
                                </div>
                            </div>

                            {/* Submit Button */}
                            <div className="flex justify-center pt-6">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="group relative px-12 py-4 bg-gradient-to-r from-[#E03A6F] to-[#c8102e] text-white text-lg font-bold rounded-full transition-all duration-300 hover:shadow-2xl hover:scale-105 transform disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 font-droid-arabic-kufi overflow-hidden"
                                >
                                    {/* Animated shine effect */}
                                    <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></span>

                                    <span className="relative flex items-center justify-center gap-3">
                                        {loading ? (
                                            <>
                                                <Loader className="w-5 h-5 animate-spin" />
                                                {t('volunteer.submitting')}
                                            </>
                                        ) : (
                                            <>
                                                <CheckCircle className="w-5 h-5" />
                                                {t('volunteer.submit')}
                                            </>
                                        )}
                                    </span>
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Additional Info Section */}
                    <div className="mt-12 text-center animate-fade-in">
                        <p className="text-gray-600 font-droid-arabic-kufi">
                            {t('volunteer.thankYou')}
                        </p>
                    </div>
                </div>
            </div>

            <Footer types={types} />
        </>
    );
};

export default VolunteerForm;