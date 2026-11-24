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

export const SelectGroup = ({ label, name, options, value, onChange, isFocused, onFocus, onBlur, required = false }) => (
    <div className="w-full group">
        <label htmlFor={name} className={`block text-sm font-semibold mb-2 transition-colors duration-200 ${isFocused ? 'text-xynexis-green' : 'text-gray-400'}`}>
            {label} {required && <span className="text-xynexis-green">*</span>}
        </label>
        <div className="relative">
            <select
                id={name}
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

export const ParticipantInformation = ({ formData, handleChange, focusedField, setFocusedField, headingClassName }) => (
    <div className="space-y-6">
        <div className="flex items-center gap-3 mb-6">
            <div className="w-1 h-8 bg-gradient-to-b from-xynexis-green to-xynexis-green/50 rounded-full"></div>
            <h2 className={`${headingClassName} text-lg md:text-xl font-semibold tracking-[0.24em] text-white/95`}>
                PARTICIPANT INFORMATION
            </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InputField
                label="1. Full Name:"
                name="full_name"
                required
                value={formData.full_name}
                onChange={handleChange}
                isFocused={focusedField === 'full_name'}
                onFocus={() => setFocusedField('full_name')}
                onBlur={() => setFocusedField(null)}
            />
            <InputField
                label="2. Company Name:"
                name="company_name"
                required
                value={formData.company_name}
                onChange={handleChange}
                isFocused={focusedField === 'company_name'}
                onFocus={() => setFocusedField('company_name')}
                onBlur={() => setFocusedField(null)}
            />

            <div className="space-y-2">
                <label className={`block text-sm font-semibold mb-2 transition-colors duration-200 ${focusedField === 'sector' ? 'text-xynexis-green' : 'text-gray-400'}`}>
                    3. Industry: <span className="text-xynexis-green">*</span>
                </label>
                <div className="relative">
                    <select
                        name="sector"
                        value={formData.sector}
                        onChange={handleChange}
                        onFocus={() => setFocusedField('sector')}
                        onBlur={() => setFocusedField(null)}
                        className={`w-full px-4 py-3.5 rounded-lg bg-[#1a1e28] border text-white appearance-none
                            focus:outline-none focus:border-xynexis-green focus:ring-2 focus:ring-xynexis-green/20
                            transition-all duration-300 hover:border-gray-600 shadow-sm cursor-pointer
                            ${formData.sector ? 'text-white' : 'text-gray-500'}
                            ${focusedField === 'sector' ? 'border-xynexis-green' : 'border-gray-700'}`}
                    >
                        <option value="" disabled>Select industry...</option>
                        <option value="Banking">Banking</option>
                        <option value="Fintech">Fintech</option>
                        <option value="Insurance">Insurance</option>
                        <option value="Telecommunications">Telecommunications</option>
                        <option value="Government & State-Owned Enterprises">Government & State-Owned Enterprises</option>
                        <option value="Other">Other</option>
                    </select>
                    <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none">
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                        </svg>
                    </div>
                </div>
            </div>

            <InputField
                label="4. Job Title:"
                name="position"
                required
                value={formData.position}
                onChange={handleChange}
                isFocused={focusedField === 'position'}
                onFocus={() => setFocusedField('position')}
                onBlur={() => setFocusedField(null)}
            />

            <InputField
                label="5. Email Address:"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleChange}
                isFocused={focusedField === 'email'}
                onFocus={() => setFocusedField('email')}
                onBlur={() => setFocusedField(null)}
            />

            <InputField
                label="6. Phone Number:"
                name="phone_number"
                type="tel"
                value={formData.phone_number}
                onChange={handleChange}
                isFocused={focusedField === 'phone_number'}
                onFocus={() => setFocusedField('phone_number')}
                onBlur={() => setFocusedField(null)}
            />
        </div>
    </div>
);
