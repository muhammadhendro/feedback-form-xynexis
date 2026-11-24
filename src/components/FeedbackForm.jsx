'use client';

import { useEffect, useRef, useState } from 'react';
import { Sora } from 'next/font/google';
import { ParticipantInformation, SelectGroup } from './FeedbackFields';

const sectionHeadingFont = Sora({
    subsets: ['latin'],
    weight: ['600', '700'],
});

const initialFormData = {
    full_name: '',
    company_name: '',
    sector: '',
    position: '',
    email: '',
    phone_number: '',
    satisfaction_overall: '',
    material_usefulness: '',
    recommend_colleagues: '',
    comments: '',
    one_on_one_session: '',
    privacy_consent: false,
    marketing_consent: false,
};

const satisfactionOptions = ['Very Satisfied', 'Satisfied', 'Neutral', 'Dissatisfied', 'Very Dissatisfied'];
const usefulnessOptions = ['Very Useful', 'Useful', 'Neutral', 'Not Very Useful', 'Not Useful'];
const yesNoOptions = ['Yes', 'No'];

export default function FeedbackForm() {
    const [formData, setFormData] = useState(initialFormData);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);
    const [focusedField, setFocusedField] = useState(null);
    const [csrfToken, setCsrfToken] = useState(null);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [downloadToken, setDownloadToken] = useState(null);

    const wrapperRef = useRef(null);

    useEffect(() => {
        const sendHeight = () => {
            if (wrapperRef.current) {
                const height = wrapperRef.current.offsetHeight + 200;
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

    useEffect(() => {
        const fetchToken = async () => {
            try {
                const response = await fetch('/api/get-feedback-token', {
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
        const { name, value, type, checked } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const validateForm = () => {
        const errors = {};
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const nameRegex = /^[a-zA-Z\s\.\-']+$/;

        if (!formData.full_name) {
            errors.full_name = 'Full name is required';
        } else if (formData.full_name.length < 2) {
            errors.full_name = 'Full name is too short';
        } else if (!nameRegex.test(formData.full_name)) {
            errors.full_name = 'Full name contains invalid characters';
        }

        if (!formData.company_name) {
            errors.company_name = 'Company name is required';
        } else if (formData.company_name.length < 2) {
            errors.company_name = 'Company name is too short';
        }

        if (!formData.sector) {
            errors.sector = 'Please select an industry';
        }

        if (!formData.position) {
            errors.position = 'Job title is required';
        }

        if (!formData.email) {
            errors.email = 'Email address is required';
        } else if (!emailRegex.test(formData.email)) {
            errors.email = 'Email address is invalid';
        }

        if (!formData.privacy_consent) {
            errors.privacy_consent = 'You must agree to the Privacy Notice';
        }

        if (!formData.satisfaction_overall) {
            errors.satisfaction_overall = 'Please select your overall satisfaction level';
        }
        if (!formData.recommend_colleagues) {
            errors.recommend_colleagues = 'Please select whether you would recommend this webinar';
        }
        if (!formData.one_on_one_session) {
            errors.one_on_one_session = 'Please select whether you are interested in a one-on-one discussion';
        }

        return errors;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        if (!csrfToken) {
            setMessage({ type: 'error', text: 'Security token is not ready yet. Please refresh the page.' });
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
            const response = await fetch('/api/submit-feedback', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    token: csrfToken,
                    formData: {
                        full_name: formData.full_name,
                        company_name: formData.company_name,
                        sector: formData.sector,
                        position: formData.position,
                        email: formData.email,
                        phone_number: formData.phone_number,
                        satisfaction_overall: formData.satisfaction_overall,
                        material_usefulness: formData.material_usefulness,
                        recommend_colleagues: formData.recommend_colleagues,
                        comments: formData.comments,
                        one_on_one_session: formData.one_on_one_session,
                        privacy_consent: formData.privacy_consent,
                        marketing_consent: formData.marketing_consent
                    }
                })
            });

            const result = await response.json();

            if (!response.ok) {
                if (response.status === 429) {
                    throw new Error(result.error || 'Please wait before submitting again.');
                }
                throw new Error(result.error || 'Form submission failed');
            }

            setIsSubmitted(true);
            if (result.downloadToken) {
                setDownloadToken(result.downloadToken);
            }
            setMessage({ type: 'success', text: 'Thank you! Your feedback has been submitted successfully.' });
            setFormData(initialFormData);

            const tokenResponse = await fetch('/api/get-feedback-token', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
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

    if (isSubmitted) {
        return (
            <div className="min-h-screen bg-transparent text-white p-4 pt-24 md:p-8 md:pt-32 flex items-start justify-center">
                <div ref={wrapperRef} className="max-w-4xl w-full">
                    <div className="bg-[#20242F] rounded-2xl shadow-2xl p-8 md:p-12 text-center border border-gray-700/50 animate-[fadeInUp_0.5s_ease-out]">
                        <div className="mb-8 flex justify-center">
                            <img
                                src="/logo.svg"
                                alt="Logo"
                                className="h-32 md:h-48 w-auto"
                            />
                        </div>

                        <div className="mb-6">
                            <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-xynexis-green/20 mb-6">
                                <svg className="h-10 w-10 text-xynexis-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">
                                Thank You!
                            </h2>
                            <div className="space-y-4 text-gray-300 text-lg md:text-xl leading-relaxed">
                                <p>
                                   Thank you for taking the time to join our webinar, &quot;AI-Driven Threats, Stronger Governance: Securing Critical Infrastructure in the Financial Ecosystem.&quot;
                                </p>
                                <p>
                                    We hope the session provided valuable insights into emerging AI-driven cyber threats, the importance of strengthening security governance, and practical strategies for protecting critical infrastructure within the financial ecosystem.
                                </p>
                                <p>
                                    We look forward to seeing you at the next{' '}
                                    <span className="text-xynexis-green font-semibold">Xynexis Webinar Series</span>.
                                </p>
                            </div>
                        </div>

                        <div className="mt-10">
                            <a
                                href={downloadToken ? `/api/download-presentation?token=${downloadToken}` : '#'}
                                target={downloadToken ? '_blank' : '_self'}
                                className={`inline-flex items-center justify-center px-8 py-4 text-lg font-bold text-white transition-all duration-300 transform bg-gradient-to-r from-xynexis-green to-xynexis-green-hover rounded-xl shadow-lg hover:shadow-xynexis-green/20 hover:scale-[1.02] active:scale-[0.98] group ${!downloadToken ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                <svg className="w-6 h-6 mr-3 group-hover:animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                </svg>
                                Download Presentation Materials
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-transparent text-white p-4 pt-24 md:p-8 md:pt-32 flex items-start justify-center">
            <div ref={wrapperRef} className="max-w-4xl w-full">
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                    <div className="absolute top-20 left-10 w-72 h-72 bg-xynexis-green/5 rounded-full blur-3xl"></div>
                    <div className="absolute bottom-20 right-10 w-96 h-96 bg-xynexis-green/5 rounded-full blur-3xl"></div>
                </div>

                <div className="relative bg-xynexis-gray/80 backdrop-blur-sm px-4 pb-6 pt-4 md:px-12 md:pb-12 md:pt-6 md:rounded-2xl md:shadow-2xl md:border border-gray-700/50 animate-fade-in-up">
                    <div className="text-center mb-6 pb-4 border-b border-gray-700/50">
                        <div className="flex justify-center mb-4">
                            <img
                                src="/logo.svg"
                                alt="Logo"
                                className="h-32 md:h-48 w-auto"
                            />
                        </div>

                        <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 tracking-tight">
                            Feedback Form
                        </h1>
                    </div>

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

                    <form onSubmit={handleSubmit} className="space-y-8">
                        <ParticipantInformation
                            formData={formData}
                            handleChange={handleChange}
                            focusedField={focusedField}
                            setFocusedField={setFocusedField}
                            headingClassName={sectionHeadingFont.className}
                        />

                        <div className="space-y-6 pt-8 border-t border-gray-700/50">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-1 h-8 bg-gradient-to-b from-xynexis-green to-xynexis-green/50 rounded-full"></div>
                                <h2 className={`${sectionHeadingFont.className} text-lg md:text-xl font-semibold tracking-[0.24em] text-white/95`}>
                                    YOUR EXPERIENCE
                                </h2>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <SelectGroup
                                    label="1. Overall, how satisfied were you with the webinar?"
                                    name="satisfaction_overall"
                                    options={satisfactionOptions}
                                    required
                                    value={formData.satisfaction_overall}
                                    onChange={handleChange}
                                    isFocused={focusedField === 'satisfaction_overall'}
                                    onFocus={() => setFocusedField('satisfaction_overall')}
                                    onBlur={() => setFocusedField(null)}
                                />

                                <SelectGroup
                                    label={'2. How useful did you find the content presented in the webinar "AI-Driven Threats, Stronger Governance: Securing Critical Infrastructure in the Financial Ecosystem"?'}
                                    name="material_usefulness"
                                    options={usefulnessOptions}
                                    value={formData.material_usefulness}
                                    onChange={handleChange}
                                    isFocused={focusedField === 'material_usefulness'}
                                    onFocus={() => setFocusedField('material_usefulness')}
                                    onBlur={() => setFocusedField(null)}
                                />

                                <SelectGroup
                                    label="3. Would you recommend this Webinar Series to your colleagues?"
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
                        </div>

                        <div className="space-y-3 pt-4 border-t border-gray-700/50">
                            <label htmlFor="comments" className={`block text-sm font-semibold transition-colors duration-200 ${focusedField === 'comments' ? 'text-xynexis-green' : 'text-gray-400'}`}>
                                4. Please share your comments, questions, or suggestions about the webinar.
                            </label>
                            <textarea
                                id="comments"
                                name="comments"
                                value={formData.comments}
                                onChange={handleChange}
                                onFocus={() => setFocusedField('comments')}
                                onBlur={() => setFocusedField(null)}
                                rows="4"
                                className="w-full px-4 py-3.5 rounded-lg bg-[#1a1e28] border border-gray-700 text-white placeholder-gray-500 
                           focus:outline-none focus:border-xynexis-green focus:ring-2 focus:ring-xynexis-green/20 
                           transition-all duration-300 resize-none hover:border-gray-600 shadow-sm"
                                placeholder="Write your response here..."
                            ></textarea>
                        </div>

                        <div className="pt-0">
                            <SelectGroup
                                label="5. Would you be interested in having a one-on-one discussion with the Xynexis team to learn more about AI-driven cyber threats, security governance, and strategies for securing critical infrastructure in the financial ecosystem?"
                                name="one_on_one_session"
                                options={yesNoOptions}
                                value={formData.one_on_one_session}
                                onChange={handleChange}
                                isFocused={focusedField === 'one_on_one_session'}
                                onFocus={() => setFocusedField('one_on_one_session')}
                                onBlur={() => setFocusedField(null)}
                                required
                            />
                        </div>

                        <div className="space-y-4 pt-2">
                            <div>
                                <label className="flex items-start gap-3 cursor-pointer group">
                                    <div className="relative flex items-center mt-0.5">
                                        <input
                                            type="checkbox"
                                            name="privacy_consent"
                                            checked={formData.privacy_consent}
                                            onChange={handleChange}
                                            className="peer sr-only"
                                        />
                                        <div className="w-5 h-5 rounded border border-gray-600 bg-[#1a1e28] peer-checked:bg-xynexis-green peer-checked:border-xynexis-green transition-all duration-200 shadow-sm group-hover:border-gray-500"></div>
                                        <svg className="absolute w-3.5 h-3.5 text-white left-0.5 top-0.5 opacity-0 peer-checked:opacity-100 transition-opacity duration-200 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                    <span className={`text-sm select-none transition-colors duration-200 ${formData.privacy_consent ? 'text-gray-200' : 'text-gray-400'}`}>
                                        I agree to the <a href="https://xynexis.com/privacy-notice/" target="_blank" rel="noopener noreferrer" className="text-xynexis-green hover:underline">Privacy Notice</a> and consent to having my data processed.
                                    </span>
                                </label>
                            </div>

                            <div>
                                <label className="flex items-start gap-3 cursor-pointer group">
                                    <div className="relative flex items-center mt-0.5">
                                        <input
                                            type="checkbox"
                                            name="marketing_consent"
                                            checked={formData.marketing_consent}
                                            onChange={handleChange}
                                            className="peer sr-only"
                                        />
                                        <div className="w-5 h-5 rounded border border-gray-600 bg-[#1a1e28] peer-checked:bg-xynexis-green peer-checked:border-xynexis-green transition-all duration-200 shadow-sm group-hover:border-gray-500"></div>
                                        <svg className="absolute w-3.5 h-3.5 text-white left-0.5 top-0.5 opacity-0 peer-checked:opacity-100 transition-opacity duration-200 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                    <span className={`text-sm select-none transition-colors duration-200 ${formData.marketing_consent ? 'text-gray-200' : 'text-gray-400'}`}>
                                        I agree to receive marketing communications and promotional offers from Xynexis
                                    </span>
                                </label>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full py-4 rounded-xl font-bold text-lg text-white transition-all duration-300 transform 
                         shadow-lg hover:shadow-xynexis-green/20 ${loading
                                ? 'bg-gray-600 cursor-not-allowed opacity-75'
                                : 'bg-gradient-to-r from-xynexis-green to-xynexis-green-hover hover:scale-[1.02] active:scale-[0.98]'
                                } mb-6`}
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
                                    Submit Feedback Form
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                    </svg>
                                </span>
                            )}
                        </button>

                        <div className="pt-12 text-center border-t border-gray-700/50">
                            <p className="text-gray-500 text-sm">
                                We look forward to seeing you at the next{' '}
                                <span className="text-xynexis-green font-semibold">Xynexis Webinar Series</span>.
                            </p>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
