import React from 'react';

const STATUS_CONFIG = {
  NEW: { label: 'New', dotClass: 'bg-info', badgeClass: 'badge-status-new' },
  ASSIGNED: { label: 'Assigned', dotClass: 'bg-warning', badgeClass: 'badge-status-assigned' },
  IN_PROGRESS: { label: 'In Progress', dotClass: 'bg-primary', badgeClass: 'badge-status-in_progress' },
  PENDING_CUSTOMER: { label: 'Pending Customer', dotClass: 'bg-secondary', badgeClass: 'badge-status-pending_customer' },
  RESOLVED: { label: 'Resolved', dotClass: 'bg-success', badgeClass: 'badge-status-resolved' },
  CLOSED: { label: 'Closed', dotClass: 'bg-secondary', badgeClass: 'badge-status-closed' },
  REOPENED: { label: 'Reopened', dotClass: 'bg-danger', badgeClass: 'badge-status-reopened' },
};

export const StatusBadge = ({ status, className = '' }) => {
  const norm = (status || '').toUpperCase().trim();
  const config = STATUS_CONFIG[norm] || {
    label: status || 'Unknown',
    dotClass: 'bg-secondary',
    badgeClass: 'badge-status-closed',
  };

  return (
    <span className={`badge ${config.badgeClass} ${className}`}>
      <span className="badge-dot"></span>
      <span>{config.label}</span>
    </span>
  );
};

