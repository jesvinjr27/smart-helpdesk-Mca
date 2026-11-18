import React from 'react';

export const FormLabel = ({ children, required = false, className = '' }) => (
  <label
    className={`block text-xs font-semibold uppercase tracking-wider text-brand-primary mb-1.5 ${className}`}
  >
    {children}
    {required && <span className="text-brand-primary font-bold ml-1">*</span>}
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
        <span className="absolute left-3 text-brand-secondary text-sm pointer-events-none">
          <i className={`bi ${icon}`} />
        </span>
        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          className={`w-full pl-9 pr-3.5 py-2 text-sm input-glow rounded-xl text-brand-primary placeholder:text-brand-secondary/60 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
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
      className={`w-full px-3.5 py-2 text-sm input-glow rounded-xl text-brand-primary placeholder:text-brand-secondary/60 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
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
    className={`w-full px-3.5 py-2 text-sm input-glow rounded-xl text-brand-primary focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer ${className}`}
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
    className={`w-full px-3.5 py-2.5 text-sm input-glow rounded-xl text-brand-primary placeholder:text-brand-secondary/60 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed resize-y ${className}`}
    {...props}
  />
);
