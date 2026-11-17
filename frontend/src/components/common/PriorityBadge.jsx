import React from 'react';

const PRIORITY_CONFIG = {
  CRITICAL: {
    label: 'Critical',
    icon: 'bi-exclamation-triangle-fill',
    badge: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/60 font-bold',
    iconColor: 'text-rose-600 dark:text-rose-400',
    pulse: true,
  },
  HIGH: {
    label: 'High',
    icon: 'bi-arrow-up-circle-fill',
    badge: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60',
    iconColor: 'text-amber-500',
    pulse: false,
  },
  MEDIUM: {
    label: 'Medium',
    icon: 'bi-dash-circle-fill',
    badge: 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800/60',
    iconColor: 'text-sky-500',
    pulse: false,
  },
  LOW: {
    label: 'Low',
    icon: 'bi-arrow-down-circle-fill',
    badge: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
    iconColor: 'text-slate-400',
    pulse: false,
  },
};

export const PriorityBadge = ({ priority, showIcon = true, className = '' }) => {
  const norm = (priority || '').toUpperCase().trim();
  const config = PRIORITY_CONFIG[norm] || {
    label: priority || 'Normal',
    icon: 'bi-circle-fill',
    badge: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
    iconColor: 'text-slate-400',
    pulse: false,
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${config.badge} ${className}`}
    >
      {showIcon && (
        <span className="relative flex items-center justify-center">
          {config.pulse && (
            <span className="animate-ping absolute inline-flex h-2.5 w-2.5 rounded-full bg-rose-400 opacity-75"></span>
          )}
          <i className={`bi ${config.icon} ${config.iconColor} text-xs relative`} />
        </span>
      )}
      <span className="whitespace-nowrap">{config.label}</span>
    </span>
  );
};
