import React from 'react';

export const EmptyState = ({
  icon = 'bi-inbox',
  title = 'No items found',
  description = 'There are no records matching your current filter criteria.',
  action = null,
  className = '',
}) => {
  return (
    <div className={`text-center py-5 px-3 ${className}`}>
      <div
        className="bg-surface-subtle border border-default rounded-circle d-inline-flex align-items-center justify-content-center mb-3"
        style={{ width: '64px', height: '64px', backgroundColor: 'var(--bg-surface-subtle)' }}
      >
        <i className={`bi ${icon} fs-2 text-muted`}></i>
      </div>
      <h6 className="fw-bold mb-1 text-primary-emphasis">{title}</h6>
      <p className="text-muted text-xs mx-auto mb-3" style={{ maxWidth: '360px' }}>
        {description}
      </p>
      {action && <div>{action}</div>}
    </div>
  );
};

