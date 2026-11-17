import React from 'react';

const PRIORITY_CONFIG = {
  CRITICAL: {
    label: 'Critical',
    icon: 'bi-exclamation-triangle-fill',
    badge: 'bg-brand-primary text-white border-brand-primary font-bold shadow-subtle',
    iconColor: 'text-brand-accent',
    pulse: true,
  },
  URGENT: {
    label: 'Urgent',
    icon: 'bi-exclamation-triangle-fill',
    badge: 'bg-brand-primary text-white border-brand-primary font-bold shadow-subtle',
    iconColor: 'text-brand-accent',
    pulse: true,
  },
  HIGH: {
    label: 'High',
    icon: 'bi-arrow-up-circle-fill',
    badge: 'bg-brand-primary/20 text-brand-primary border-brand-primary/40 font-semibold',
    iconColor: 'text-brand-primary',
    pulse: false,
  },
  MEDIUM: {
    label: 'Medium',
    icon: 'bi-dash-circle-fill',
    badge: 'bg-brand-secondary/25 text-brand-primary border-brand-secondary/40 font-medium',
    iconColor: 'text-brand-primary',
    pulse: false,
  },
  LOW: {
    label: 'Low',
    icon: 'bi-arrow-down-circle-fill',
    badge: 'bg-brand-accent/20 text-brand-primary/80 border-brand-accent/40 font-medium',
    iconColor: 'text-brand-primary/70',
    pulse: false,
  },
};

export const PriorityBadge = ({ priority, showIcon = true, className = '' }) => {
  const norm = (priority || '').toUpperCase().trim();
  const config = PRIORITY_CONFIG[norm] || {
    label: priority || 'Normal',
    icon: 'bi-circle-fill',
    badge: 'bg-brand-secondary/20 text-brand-primary border-brand-secondary/40',
    iconColor: 'text-brand-secondary',
    pulse: false,
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${config.badge} ${className}`}
    >
      {showIcon && (
        <span className="relative flex items-center justify-center">
          {config.pulse && (
            <span className="animate-ping absolute inline-flex h-2.5 w-2.5 rounded-full bg-brand-accent opacity-75"></span>
          )}
          <i className={`bi ${config.icon} ${config.iconColor} text-xs relative`} />
        </span>
      )}
      <span className="whitespace-nowrap">{config.label}</span>
    </span>
  );
};
