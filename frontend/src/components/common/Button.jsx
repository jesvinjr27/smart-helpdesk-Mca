import React from 'react';

const VARIANT_STYLES = {
  primary:
    'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white shadow-xs focus:ring-blue-500/30',
  secondary:
    'bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 focus:ring-slate-400/20',
  outline:
    'bg-transparent hover:bg-slate-100 text-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-700 focus:ring-slate-400/20',
  'outline-primary':
    'bg-transparent hover:bg-blue-50 text-blue-600 dark:text-blue-400 dark:hover:bg-blue-950/40 border border-blue-200 dark:border-blue-800/80 focus:ring-blue-500/20',
  danger:
    'bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white shadow-xs focus:ring-rose-500/30',
  'outline-danger':
    'bg-transparent hover:bg-rose-50 text-rose-600 dark:text-rose-400 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-800/80 focus:ring-rose-500/20',
  success:
    'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white shadow-xs focus:ring-emerald-500/30',
  ai:
    'bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:opacity-95 text-white shadow-ai-glow focus:ring-purple-500/30',
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
