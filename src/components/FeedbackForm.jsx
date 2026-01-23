'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '../utils/supabaseClient';

const InputField = ({ label, name, type = 'text', required = false, value, onChange, isFocused, onFocus, onBlur }) => (
    <div className="w-full group">
        <label className={`block text-sm font-semibold mb-2 transition-colors duration-200 ${isFocused ? 'text-xynexis-green' : 'text-gray-400'}`}>
            {label} {required && <span className="text-xynexis-green">*</span>}
        </label>
        <input
            type={type}
            name={name}
            value={value}
            onChange={onChange}
            onFocus={onFocus}
            onBlur={onBlur}
            className="w-full px-4 py-3.5 rounded-lg bg-[#1a1e28] border border-gray-700 text-white placeholder-gray-500 
                 focus:outline-none focus:border-xynexis-green focus:ring-2 focus:ring-xynexis-green/20 
                 transition-all duration-300 hover:border-gray-600 shadow-sm"
            required={required}
        />
    </div>
);

const SelectGroup = ({ label, name, options, required = false, value, onChange, isFocused, onFocus, onBlur }) => (
    <div className="w-full group">
        <label className={`block text-sm font-semibold mb-2 transition-colors duration-200 ${isFocused ? 'text-xynexis-green' : 'text-gray-400'}`}>
            {label} {required && <span className="text-xynexis-green">*</span>}
        </label>
        <div className="relative">
            <select
                name={name}
                value={value}
                onChange={onChange}
                onFocus={onFocus}
                onBlur={onBlur}
                className="w-full px-4 py-3.5 rounded-lg bg-[#1a1e28] border border-gray-700 text-white 
                   focus:outline-none focus:border-xynexis-green focus:ring-2 focus:ring-xynexis-green/20 
                   transition-all duration-300 appearance-none cursor-pointer hover:border-gray-600 shadow-sm"
                required={required}
            >
                <option value="" disabled className="text-gray-500">Select an option...</option>
                {options.map((option) => (
                    <option key={option} value={option} className="bg-[#1a1e28] text-white">
                        {option}
                    </option>
                ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-400">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
            </div>
        </div>
    </div>
);

export default function FeedbackForm() {
    const [formData, setFormData] = useState({
        full_name: '',
        company_name: '',
        email: '',
        satisfaction_overall: '',
        material_usefulness: '',
        speaker_interest: '',
        attend_again: '',
        recommend_colleagues: '',
        comments: ''
    });

    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);
    const [focusedField, setFocusedField] = useState(null);

    // Auto-resize iframe logic
    const wrapperRef = useRef(null);
    useEffect(() => {
        const sendHeight = () => {
            if (wrapperRef.current) {
                const height = wrapperRef.current.offsetHeight;
                window.parent.postMessage({ frameHeight: height }, '*');
            }
        };

        const resizeObserver = new ResizeObserver(() => {
            sendHeight();
        });

        if (wrapperRef.current) {
            resizeObserver.observe(wrapperRef.current);
        }

        const intervalId = setInterval(sendHeight, 500);
        sendHeight();

        return () => {
            resizeObserver.disconnect();
            clearInterval(intervalId);
        };
    }, []);



    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        if (!formData.full_name || !formData.company_name || !formData.email) {
            setMessage({ type: 'error', text: 'Please fill in all required fields.' });
            setLoading(false);
            return;
        }

        try {
            const { error } = await supabase
                .from('feedback_submissions')
                .insert([formData]);

            if (error) throw error;

            setMessage({ type: 'success', text: '✨ Thank you! Your feedback has been submitted successfully.' });
            setFormData({
                full_name: '',
                company_name: '',
                email: '',
                satisfaction_overall: '',
                material_usefulness: '',
                speaker_interest: '',
                attend_again: '',
                recommend_colleagues: '',
                comments: ''
            });
        } catch (error) {
            console.error('Error submitting feedback:', error);
            setMessage({ type: 'error', text: 'Something went wrong. Please try again.' });
        } finally {
            setLoading(false);
        }
    };

    const scaleOptions = ['Very Satisfied', 'Satisfied', 'Neutral', 'Dissatisfied', 'Very Dissatisfied'];
    const yesNoOptions = ['Yes', 'No'];

    return (
        <div className="w-full p-4 md:p-8" ref={wrapperRef}>
            <div className="max-w-4xl w-full mx-auto">
                {/* Decorative Elements */}
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                    <div className="absolute top-20 left-10 w-72 h-72 bg-xynexis-green/5 rounded-full blur-3xl"></div>
                    <div className="absolute bottom-20 right-10 w-96 h-96 bg-xynexis-green/5 rounded-full blur-3xl"></div>
                </div>

                <div className="relative bg-xynexis-gray/80 backdrop-blur-sm px-8 pb-8 pt-2 md:px-12 md:pb-12 md:pt-4 rounded-2xl shadow-2xl border border-gray-700/50 animate-fade-in-up">
                    {/* Header */}
                    <div className="text-center mb-10 pb-8 border-b border-gray-700/50">
                        {/* Logo */}
                        <div className="flex justify-center mb-6">
                            <img
                                src="/logo.svg"
                                alt="Logo"
                                className="h-32 md:h-48 w-auto"
                            />
                        </div>

                        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">
                            Feedback Form
                        </h1>
                        <p className="text-gray-400 text-lg max-w-2xl mx-auto leading-relaxed">
                            Please fill out the feedback form below to receive presentation materials from the Webinar Series 2025.
                        </p>
                    </div>

                    {/* Message Alert */}
                    {message && (
                        <div className={`p-5 mb-8 rounded-xl border flex items-center gap-3 animate-fade-in-up ${message.type === 'success'
                            ? 'bg-xynexis-green/10 border-xynexis-green/30 text-xynexis-green'
                            : 'bg-red-500/10 border-red-500/30 text-red-400'
                            }`}>
                            {message.type === 'success' ? (
                                <svg className="w-6 h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            ) : (
                                <svg className="w-6 h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            )}
                            <span className="font-medium">{message.text}</span>
                        </div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-8">
                        {/* Personal Information Section */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-1 h-8 bg-gradient-to-b from-xynexis-green to-xynexis-green/50 rounded-full"></div>
                                <h2 className="text-xl font-bold text-white">Personal Information</h2>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <InputField
                                    label="Full Name"
                                    name="full_name"
                                    required
                                    value={formData.full_name}
                                    onChange={handleChange}
                                    isFocused={focusedField === 'full_name'}
                                    onFocus={() => setFocusedField('full_name')}
                                    onBlur={() => setFocusedField(null)}
                                />
                                <InputField
                                    label="Company Name"
                                    name="company_name"
                                    required
                                    value={formData.company_name}
                                    onChange={handleChange}
                                    isFocused={focusedField === 'company_name'}
                                    onFocus={() => setFocusedField('company_name')}
                                    onBlur={() => setFocusedField(null)}
                                />
                            </div>

                            <InputField
                                label="Your email"
                                name="email"
                                type="email"
                                required
                                value={formData.email}
                                onChange={handleChange}
                                isFocused={focusedField === 'email'}
                                onFocus={() => setFocusedField('email')}
                                onBlur={() => setFocusedField(null)}
                            />
                        </div>

                        {/* Experience Section */}
                        <div className="space-y-6 pt-8 border-t border-gray-700/50">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-1 h-8 bg-gradient-to-b from-xynexis-green to-xynexis-green/50 rounded-full"></div>
                                <h2 className="text-xl font-bold text-white">Your Experience</h2>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <SelectGroup
                                    label="Overall, how satisfied are you with the Webinar Series event?"
                                    name="satisfaction_overall"
                                    options={scaleOptions}
                                    required
                                    value={formData.satisfaction_overall}
                                    onChange={handleChange}
                                    isFocused={focusedField === 'satisfaction_overall'}
                                    onFocus={() => setFocusedField('satisfaction_overall')}
                                    onBlur={() => setFocusedField(null)}
                                />

                                <SelectGroup
                                    label="How useful was the material presented at Webinar Series?"
                                    name="material_usefulness"
                                    options={scaleOptions}
                                    required
                                    value={formData.material_usefulness}
                                    onChange={handleChange}
                                    isFocused={focusedField === 'material_usefulness'}
                                    onFocus={() => setFocusedField('material_usefulness')}
                                    onBlur={() => setFocusedField(null)}
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <SelectGroup
                                    label="How interesting are the speakers at the Webinar Series?"
                                    name="speaker_interest"
                                    options={scaleOptions}
                                    required
                                    value={formData.speaker_interest}
                                    onChange={handleChange}
                                    isFocused={focusedField === 'speaker_interest'}
                                    onFocus={() => setFocusedField('speaker_interest')}
                                    onBlur={() => setFocusedField(null)}
                                />

                                <SelectGroup
                                    label="Would you like to attend the Webinar Series again next year?"
                                    name="attend_again"
                                    options={yesNoOptions}
                                    required
                                    value={formData.attend_again}
                                    onChange={handleChange}
                                    isFocused={focusedField === 'attend_again'}
                                    onFocus={() => setFocusedField('attend_again')}
                                    onBlur={() => setFocusedField(null)}
                                />
                            </div>

                            <SelectGroup
                                label="Would you like to recommend the Webinar Series to your colleagues?"
                                name="recommend_colleagues"
                                options={yesNoOptions}
                                required
                                value={formData.recommend_colleagues}
                                onChange={handleChange}
                                isFocused={focusedField === 'recommend_colleagues'}
                                onFocus={() => setFocusedField('recommend_colleagues')}
                                onBlur={() => setFocusedField(null)}
                            />
                        </div>

                        {/* Comments Section */}
                        <div className="space-y-3 pt-8 border-t border-gray-700/50">
                            <label className={`block text-sm font-semibold transition-colors duration-200 ${focusedField === 'comments' ? 'text-xynexis-green' : 'text-gray-400'}`}>
                                Please provide us with your comments, questions, or criticism and suggestions regarding the Webinar Series event.
                            </label>
                            <textarea
                                name="comments"
                                value={formData.comments}
                                onChange={handleChange}
                                onFocus={() => setFocusedField('comments')}
                                onBlur={() => setFocusedField(null)}
                                rows="5"
                                className="w-full px-4 py-3.5 rounded-lg bg-[#1a1e28] border border-gray-700 text-white placeholder-gray-500 
                           focus:outline-none focus:border-xynexis-green focus:ring-2 focus:ring-xynexis-green/20 
                           transition-all duration-300 resize-none hover:border-gray-600 shadow-sm"
                                placeholder="Share your thoughts with us..."
                            ></textarea>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full py-4 rounded-xl font-bold text-lg text-white transition-all duration-300 transform 
                         shadow-lg hover:shadow-xynexis-green/20 ${loading
                                    ? 'bg-gray-600 cursor-not-allowed opacity-75'
                                    : 'bg-gradient-to-r from-xynexis-green to-xynexis-green-hover hover:scale-[1.02] active:scale-[0.98]'
                                }`}
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-3">
                                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Processing...
                                </span>
                            ) : (
                                <span className="flex items-center justify-center gap-2">
                                    Submit Feedback
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                    </svg>
                                </span>
                            )}
                        </button>

                        {/* Footer Note */}
                        <div className="pt-6 text-center border-t border-gray-700/50">
                            <p className="text-gray-500 text-sm">
                                We would love to hear your feedback so that we can provide a better experience at the next{' '}
                                <span className="text-xynexis-green font-semibold">Webinar Series</span>.
                            </p>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
