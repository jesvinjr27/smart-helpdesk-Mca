import React from 'react';

const VARIANT_STYLES = {
  primary:
    'bg-brand-primary hover:bg-brand-primary/90 active:bg-brand-primary text-white shadow-subtle focus:ring-brand-accent/40',
  secondary:
    'bg-brand-secondary hover:bg-brand-secondary/90 active:bg-brand-secondary text-white shadow-subtle focus:ring-brand-accent/40',
  outline:
    'bg-transparent hover:bg-brand-secondary/15 active:bg-brand-secondary/25 text-brand-primary border border-brand-primary/30 focus:ring-brand-accent/30',
  'outline-primary':
    'bg-transparent hover:bg-brand-accent/20 active:bg-brand-accent/30 text-brand-primary border border-brand-primary/40 focus:ring-brand-accent/30',
  danger:
    'bg-brand-primary hover:bg-brand-primary/85 active:bg-brand-primary text-white border border-brand-primary/50 shadow-subtle focus:ring-brand-accent/30',
  'outline-danger':
    'bg-transparent hover:bg-brand-primary/10 active:bg-brand-primary/20 text-brand-primary border border-brand-primary/50 focus:ring-brand-accent/30',
  success:
    'bg-brand-primary hover:bg-brand-primary/90 active:bg-brand-primary text-white shadow-subtle focus:ring-brand-accent/40',
  ai:
    'bg-brand-primary hover:bg-brand-primary/90 text-white border border-brand-secondary/50 shadow-glow-primary focus:ring-brand-accent/40',
};

const SIZE_STYLES = {
  xs: 'px-2.5 py-1 text-xs rounded-md gap-1',
  sm: 'px-3 py-1.5 text-xs sm:text-sm rounded-lg gap-1.5',
  md: 'px-4 py-2 text-sm rounded-xl gap-2',
  lg: 'px-5 py-2.5 text-base rounded-xl gap-2.5',
};

export const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  icon = null,
  disabled = false,
  loading = false,
  type = 'button',
  onClick,
  className = '',
  title,
}) => {
  const variantClass = VARIANT_STYLES[variant] || VARIANT_STYLES.primary;
  const sizeClass = SIZE_STYLES[size] || SIZE_STYLES.md;

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      title={title}
      className={`inline-flex items-center justify-center font-medium transition-all duration-150 focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed select-none ${variantClass} ${sizeClass} ${className}`}
    >
      {loading ? (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin flex-shrink-0" />
      ) : icon ? (
        <i className={`bi ${icon} flex-shrink-0`} />
      ) : null}
      {children}
    </button>
  );
};
