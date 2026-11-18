import React from 'react';

const STATUS_CONFIG = {
  NEW: {
    label: 'New',
    badge: 'bg-brand-accent/30 text-brand-primary border-brand-accent/60',
    icon: 'bi-sparkles',
  },
  ASSIGNED: {
    label: 'Assigned',
    badge: 'bg-brand-secondary/25 text-brand-primary border-brand-secondary/50',
    icon: 'bi-person-check',
  },
  IN_PROGRESS: {
    label: 'In Progress',
    badge: 'bg-brand-secondary/35 text-brand-primary border-brand-primary/30',
    icon: 'bi-arrow-repeat',
  },
  PENDING_CUSTOMER: {
    label: 'Pending Customer',
    badge: 'bg-brand-accent/20 text-brand-primary border-brand-accent/50',
    icon: 'bi-hourglass-split',
  },
  RESOLVED: {
    label: 'Resolved',
    badge: 'bg-brand-primary/10 text-brand-primary border-brand-primary/30',
    icon: 'bi-check-circle-fill',
  },
  CLOSED: {
    label: 'Closed',
    badge: 'bg-brand-primary/15 text-brand-primary/80 border-brand-primary/25',
    icon: 'bi-lock-fill',
  },
  REOPENED: {
    label: 'Reopened',
    badge: 'bg-brand-primary text-white border-brand-primary shadow-subtle',
    icon: 'bi-exclamation-circle-fill',
  },
};

export const StatusBadge = ({ status, className = '' }) => {
  const norm = (status || '').toUpperCase().trim();
  const config = STATUS_CONFIG[norm] || {
    label: status || 'Unknown',
    badge: 'bg-brand-secondary/15 text-brand-primary border-brand-secondary/30',
    icon: 'bi-record-fill',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${config.badge} ${className}`}
    >
      <i className={`bi ${config.icon} text-[11px] flex-shrink-0`} />
      <span className="whitespace-nowrap">{config.label}</span>
    </span>
  );
};
