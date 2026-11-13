import React from 'react';

const PRIORITY_CONFIG = {
  CRITICAL: { label: 'Critical', icon: 'bi-exclamation-triangle-fill', badgeClass: 'badge-priority-critical' },
  HIGH: { label: 'High', icon: 'bi-arrow-up-circle-fill', badgeClass: 'badge-priority-high' },
  MEDIUM: { label: 'Medium', icon: 'bi-dash-circle-fill', badgeClass: 'badge-priority-medium' },
  LOW: { label: 'Low', icon: 'bi-arrow-down-circle-fill', badgeClass: 'badge-priority-low' },
};

export const PriorityBadge = ({ priority, showIcon = true, className = '' }) => {
  const norm = (priority || '').toUpperCase().trim();
  const config = PRIORITY_CONFIG[norm] || {
    label: priority || 'Normal',
    icon: 'bi-circle-fill',
    badgeClass: 'badge-priority-low',
  };

  return (
    <span className={`badge ${config.badgeClass} ${className}`}>
      {showIcon && <i className={`bi ${config.icon} me-1`} style={{ fontSize: '0.75rem' }}></i>}
      <span>{config.label}</span>
    </span>
  );
};

