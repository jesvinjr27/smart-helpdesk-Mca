import React from 'react';

const VARIANT_STYLES = {
  primary: {
    bar: 'bg-brand-primary',
    iconBg: 'bg-brand-secondary/15 text-brand-primary',
  },
  success: {
    bar: 'bg-brand-secondary',
    iconBg: 'bg-brand-accent/20 text-brand-primary',
  },
  warning: {
    bar: 'bg-brand-primary',
    iconBg: 'bg-brand-secondary/25 text-brand-primary',
  },
  danger: {
    bar: 'bg-brand-primary',
    iconBg: 'bg-brand-primary text-white',
  },
  ai: {
    bar: 'bg-brand-accent',
    iconBg: 'bg-brand-accent/30 text-brand-primary',
  },
};

export const StatCard = ({
  title,
  value,
  subtitle,
  icon = 'bi-bar-chart',
  variant = 'primary',
  trend = null,
  pulse = false,
  className = '',
}) => {
  const styles = VARIANT_STYLES[variant] || VARIANT_STYLES.primary;

  return (
    <div
      className={`relative overflow-hidden bg-app-background border border-brand-primary/15 rounded-xl p-5 shadow-subtle hover:border-brand-primary/30 transition-all duration-200 hover:-translate-y-0.5 ${className}`}
    >
      {/* Top Accent Color Bar */}
      <div className={`absolute top-0 left-0 right-0 h-1 ${styles.bar}`} />

      <div className="flex justify-between items-start gap-3">
        <div className="min-w-0">
          <span className="text-xs font-semibold uppercase tracking-wider text-brand-secondary block truncate">
            {title}
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <h3 className="text-2xl sm:text-3xl font-bold tracking-tight text-brand-primary truncate">
              {value}
            </h3>
            {pulse && (
              <span className="relative flex h-2.5 w-2.5 flex-shrink-0" title="Active critical condition">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-accent opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-brand-primary"></span>
              </span>
            )}
          </div>
        </div>

        <div className={`w-11 h-11 rounded-lg flex items-center justify-center text-lg flex-shrink-0 ${styles.iconBg}`}>
          <i className={`bi ${icon}`} />
        </div>
      </div>

      {(subtitle || trend) && (
        <div className="mt-3 pt-2.5 border-t border-brand-primary/10 flex items-center justify-between text-xs text-brand-secondary gap-2">
          {subtitle && <span className="truncate">{subtitle}</span>}
          {trend && (
            <span
              className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded font-semibold text-xs flex-shrink-0 bg-brand-secondary/20 text-brand-primary border border-brand-secondary/30"
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
