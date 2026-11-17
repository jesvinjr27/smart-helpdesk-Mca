import React from 'react';

const VARIANT_STYLES = {
  primary: {
    bar: 'bg-blue-600',
    iconBg: 'bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400',
  },
  success: {
    bar: 'bg-emerald-600',
    iconBg: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400',
  },
  warning: {
    bar: 'bg-amber-600',
    iconBg: 'bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400',
  },
  danger: {
    bar: 'bg-rose-600',
    iconBg: 'bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400',
  },
  ai: {
    bar: 'bg-purple-600',
    iconBg: 'bg-purple-50 text-purple-600 dark:bg-purple-950/50 dark:text-purple-400',
  },
};

export const StatCard = ({
  title,
  value,
  subtitle,
  icon = 'bi-bar-chart',
  variant = 'primary', // 'primary' | 'success' | 'warning' | 'danger' | 'ai'
  trend = null, // { text: '+12%', isPositive: true }
  pulse = false,
  className = '',
}) => {
  const styles = VARIANT_STYLES[variant] || VARIANT_STYLES.primary;

  return (
    <div
      className={`relative overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 ${className}`}
    >
      {/* Top Accent Color Bar */}
      <div className={`absolute top-0 left-0 right-0 h-1 ${styles.bar}`} />

      <div className="flex justify-between items-start gap-3">
        <div className="min-w-0">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 block truncate">
            {title}
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <h3 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 truncate">
              {value}
            </h3>
            {pulse && (
              <span className="relative flex h-2.5 w-2.5 flex-shrink-0" title="Active critical condition">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
              </span>
            )}
          </div>
        </div>

        <div className={`w-11 h-11 rounded-lg flex items-center justify-center text-lg flex-shrink-0 ${styles.iconBg}`}>
          <i className={`bi ${icon}`} />
        </div>
      </div>

      {(subtitle || trend) && (
        <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 gap-2">
          {subtitle && <span className="truncate">{subtitle}</span>}
          {trend && (
            <span
              className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded font-semibold text-xs flex-shrink-0 ${
                trend.isPositive
                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                  : 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400'
              }`}
            >
              <i className={`bi ${trend.isPositive ? 'bi-arrow-up-short' : 'bi-arrow-down-short'} text-sm`} />
              {trend.text}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
