// src/components/Common/FormInputs.jsx
// Unified form input components with consistent styling

import React, { useState } from 'react';

/**
 * Base input wrapper component
 * Provides consistent styling for all input types
 */
const InputWrapper = ({ 
  icon: Icon, 
  label, 
  required, 
  error, 
  focused,
  disabled,
  children 
}) => (
  <div className="relative w-full">
    {label && (
      <label className="block text-sm font-medium text-gray-700 mb-1.5 font-droid-arabic-kufi">
        {label}
        {required && <span className="text-red-500 mr-1">*</span>}
      </label>
    )}
    <div className={`
      relative rounded-lg border transition-all duration-200
      ${focused ? 'border-blue-400 shadow-sm ring-2 ring-blue-100' : error ? 'border-red-400' : 'border-gray-300'}
      ${disabled ? 'bg-gray-50' : 'bg-white'}
    `}>
      {Icon && (
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 z-10 pointer-events-none">
          <Icon className={`w-4 h-4 ${focused ? 'text-blue-500' : 'text-gray-400'}`} />
        </div>
      )}
      {children}
    </div>
    {error && (
      <p className="text-red-500 text-xs mt-1 font-droid-arabic-kufi animate-slideIn">
        {error}
      </p>
    )}
  </div>
);

/**
 * Unified Text Input Component
 * For text, email, tel, password, etc.
 */
export const Input = ({ 
  icon,
  label,
  name,
  type = 'text',
  value,
  onChange,
  placeholder,
  required = false,
  error,
  disabled = false,
  className = '',
  ...props
}) => {
  const [focused, setFocused] = useState(false);

  return (
    <InputWrapper
      icon={icon}
      label={label}
      required={required}
      error={error}
      focused={focused}
      disabled={disabled}
    >
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        className={`
          w-full h-11 px-3 rounded-lg
          focus:outline-none
          font-droid-arabic-kufi text-sm
          ${icon ? 'pl-10' : 'pl-3'} pr-3
          ${disabled ? 'bg-gray-50 cursor-not-allowed text-gray-500' : 'bg-transparent text-gray-900'}
          placeholder:text-gray-400
          ${className}
        `}
        dir="rtl"
        {...props}
      />
    </InputWrapper>
  );
};

/**
 * Unified Select Component
 * For dropdown selections with consistent height
 */
export const Select = ({ 
  icon,
  label,
  name,
  value,
  onChange,
  placeholder = 'اختر...',
  required = false,
  error,
  disabled = false,
  options = [],
  className = '',
  ...props
}) => {
  const [focused, setFocused] = useState(false);

  return (
    <InputWrapper
      icon={icon}
      label={label}
      required={required}
      error={error}
      focused={focused}
      disabled={disabled}
    >
      <select
        name={name}
        value={value}
        onChange={onChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        required={required}
        disabled={disabled}
        className={`
          w-full h-11 px-3 rounded-lg
          focus:outline-none
          font-droid-arabic-kufi text-sm
          ${icon ? 'pl-10' : 'pl-3'} pr-8
          ${disabled ? 'bg-gray-50 cursor-not-allowed text-gray-500' : 'bg-transparent text-gray-900'}
          appearance-none
          cursor-pointer
          ${className}
        `}
        dir="rtl"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%236B7280' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'left 0.75rem center',
          backgroundSize: '12px'
        }}
        {...props}
      >
        <option value="" disabled={required}>
          {placeholder}
        </option>
        {options.map((option, index) => (
          <option key={option.value || index} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </InputWrapper>
  );
};

/**
 * Unified Textarea Component
 * For multiline text input
 */
export const Textarea = ({ 
  icon,
  label,
  name,
  value,
  onChange,
  placeholder,
  required = false,
  error,
  disabled = false,
  rows = 4,
  className = '',
  ...props
}) => {
  const [focused, setFocused] = useState(false);

  return (
    <InputWrapper
      icon={icon}
      label={label}
      required={required}
      error={error}
      focused={focused}
      disabled={disabled}
    >
      <textarea
        name={name}
        value={value}
        onChange={onChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        rows={rows}
        className={`
          w-full px-3 py-2.5 rounded-lg
          focus:outline-none
          font-droid-arabic-kufi text-sm
          ${icon ? 'pl-10' : 'pl-3'} pr-3
          ${disabled ? 'bg-gray-50 cursor-not-allowed text-gray-500' : 'bg-transparent text-gray-900'}
          placeholder:text-gray-400
          resize-vertical
          ${className}
        `}
        dir="rtl"
        {...props}
      />
    </InputWrapper>
  );
};

/**
 * Unified Checkbox Component
 */
export const Checkbox = ({
  label,
  checked,
  onChange,
  disabled = false,
  className = '',
  ...props
}) => (
  <label className={`
    flex items-center gap-3 cursor-pointer
    ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'}
    p-3 rounded-lg transition-colors
    ${className}
  `}>
    <input
      type="checkbox"
      checked={checked}
      onChange={onChange}
      disabled={disabled}
      className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-2 focus:ring-blue-500 focus:ring-offset-0 cursor-pointer"
      {...props}
    />
    <span className="font-droid-arabic-kufi text-sm text-gray-700 flex-1">
      {label}
    </span>
  </label>
);

/**
 * Unified Radio Component
 */
export const Radio = ({
  label,
  checked,
  onChange,
  disabled = false,
  name,
  value,
  className = '',
  ...props
}) => (
  <label className={`
    flex items-center gap-3 cursor-pointer
    ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'}
    p-3 rounded-lg transition-colors
    ${className}
  `}>
    <input
      type="radio"
      name={name}
      value={value}
      checked={checked}
      onChange={onChange}
      disabled={disabled}
      className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-2 focus:ring-blue-500 focus:ring-offset-0 cursor-pointer"
      {...props}
    />
    <span className="font-droid-arabic-kufi text-sm text-gray-700 flex-1">
      {label}
    </span>
  </label>
);

/**
 * Form Group - For grouping multiple inputs in a grid
 */
export const FormGroup = ({ children, columns = 1, className = '' }) => {
  const gridCols = {
    1: 'grid-cols-1',
    2: 'md:grid-cols-2',
    3: 'md:grid-cols-3',
    4: 'md:grid-cols-4',
  };

  return (
    <div className={`grid ${gridCols[columns]} gap-4 ${className}`}>
      {children}
    </div>
  );
};

export default { Input, Select, Textarea, Checkbox, Radio, FormGroup };