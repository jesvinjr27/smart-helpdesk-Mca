import React from 'react';

export const FormLabel = ({ children, required = false, className = '' }) => (
  <label
    className={`block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5 ${className}`}
  >
    {children}
    {required && <span className="text-rose-500 ml-1">*</span>}
  </label>
);

export const FormInput = ({
  type = 'text',
  placeholder,
  value,
  onChange,
  disabled = false,
  required = false,
  className = '',
  icon = null,
  ...props
}) => {
  if (icon) {
    return (
      <div className="relative flex items-center">
        <span className="absolute left-3 text-slate-400 dark:text-slate-500 text-sm pointer-events-none">
          <i className={`bi ${icon}`} />
        </span>
        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          className={`w-full pl-9 pr-3.5 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors disabled:bg-slate-50 dark:disabled:bg-slate-800 disabled:cursor-not-allowed ${className}`}
          {...props}
        />
      </div>
    );
  }

  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      required={required}
      className={`w-full px-3.5 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors disabled:bg-slate-50 dark:disabled:bg-slate-800 disabled:cursor-not-allowed ${className}`}
      {...props}
    />
  );
};

export const FormSelect = ({
  value,
  onChange,
  children,
  disabled = false,
  required = false,
  className = '',
  ...props
}) => (
  <select
    value={value}
    onChange={onChange}
    disabled={disabled}
    required={required}
    className={`w-full px-3.5 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors disabled:bg-slate-50 dark:disabled:bg-slate-800 disabled:cursor-not-allowed cursor-pointer ${className}`}
    {...props}
  >
    {children}
  </select>
);

export const FormTextarea = ({
  rows = 4,
  value,
  onChange,
  placeholder,
  disabled = false,
  required = false,
  className = '',
  ...props
}) => (
  <textarea
    rows={rows}
    value={value}
    onChange={onChange}
    placeholder={placeholder}
    disabled={disabled}
    required={required}
    className={`w-full px-3.5 py-2.5 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors disabled:bg-slate-50 dark:disabled:bg-slate-800 disabled:cursor-not-allowed resize-y ${className}`}
    {...props}
  />
);
