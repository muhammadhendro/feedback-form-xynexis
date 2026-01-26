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
        recommend_colleagues: '',
        comments: ''
    });

    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);
    const [focusedField, setFocusedField] = useState(null);
    const [csrfToken, setCsrfToken] = useState(null);

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

    // Fetch CSRF token on mount
    useEffect(() => {
        const fetchToken = async () => {
            try {
                const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/get-feedback-token`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
                
                if (response.ok) {
                    const data = await response.json();
                    setCsrfToken(data.token);
                } else {
                    console.error('Failed to fetch token');
                }
            } catch (error) {
                console.error('Error fetching token:', error);
            }
        };
        
        fetchToken();
    }, []);



    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const validateForm = () => {
        const errors = {};
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const nameRegex = /^[a-zA-Z\s\.\-\']+$/;

        if (!formData.full_name) {
            errors.full_name = 'Full name is required';
        } else if (formData.full_name.length < 2) {
            errors.full_name = 'Name is too short';
        } else if (!nameRegex.test(formData.full_name)) {
            errors.full_name = 'Name contains invalid characters';
        }

        if (!formData.company_name) {
            errors.company_name = 'Company name is required';
        } else if (formData.company_name.length < 2) {
            errors.company_name = 'Company name is too short';
        }

        if (!formData.email) {
            errors.email = 'Email is required';
        } else if (!emailRegex.test(formData.email)) {
            errors.email = 'Invalid email address';
        }

        return errors;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        // Check if token is ready
        if (!csrfToken) {
            setMessage({ type: 'error', text: 'Security token not ready. Please refresh the page.' });
            setLoading(false);
            return;
        }

        const validationErrors = validateForm();
        if (Object.keys(validationErrors).length > 0) {
            const firstError = Object.values(validationErrors)[0];
            setMessage({ type: 'error', text: firstError });
            setLoading(false);
            return;
        }

        try {
            // Submit via Edge Function
            const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/submit-feedback`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    token: csrfToken,
                    formData: {
                        full_name: formData.full_name,
                        company_name: formData.company_name,
                        email: formData.email,
                        satisfaction_overall: formData.satisfaction_overall,
                        material_usefulness: formData.material_usefulness,
                        recommend_colleagues: formData.recommend_colleagues,
                        comments: formData.comments
                    }
                })
            });

            const result = await response.json();

            if (!response.ok) {
                if (response.status === 429) {
                    // Rate limit exceeded
                    throw new Error(result.error || 'Please wait before submitting again.');
                }
                throw new Error(result.error || 'Submission failed');
            }

            // Success
            setMessage({ type: 'success', text: '✨ Thank you! Your feedback has been submitted successfully.' });
            setFormData({
                full_name: '',
                company_name: '',
                email: '',
                satisfaction_overall: '',
                material_usefulness: '',
                recommend_colleagues: '',
                comments: ''
            });
            
            // Fetch new token for next submission
            const tokenResponse = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/get-feedback-token`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });
            if (tokenResponse.ok) {
                const tokenData = await tokenResponse.json();
                setCsrfToken(tokenData.token);
            }

        } catch (error) {
            console.error('Error submitting feedback:', error);
            setMessage({ type: 'error', text: error.message || 'Something went wrong. Please try again.' });
        } finally {
            setLoading(false);
        }
    };

    const scaleOptions = ['Very Satisfied', 'Satisfied', 'Neutral', 'Dissatisfied', 'Very Dissatisfied'];
    const yesNoOptions = ['Yes', 'No'];

    return (
        <div className="w-full px-0 pt-24 md:p-8 md:pt-28" ref={wrapperRef}>
            <div className="w-full md:max-w-4xl md:mx-auto">
                {/* Decorative Elements */}
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                    <div className="absolute top-20 left-10 w-72 h-72 bg-xynexis-green/5 rounded-full blur-3xl"></div>
                    <div className="absolute bottom-20 right-10 w-96 h-96 bg-xynexis-green/5 rounded-full blur-3xl"></div>
                </div>

                <div className="relative bg-xynexis-gray/80 backdrop-blur-sm px-4 pb-6 pt-4 md:px-12 md:pb-12 md:pt-6 md:rounded-2xl md:shadow-2xl md:border border-gray-700/50 animate-fade-in-up">
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
