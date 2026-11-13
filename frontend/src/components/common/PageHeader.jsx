import React from 'react';

export const PageHeader = ({
  title,
  subtitle,
  badge,
  breadcrumbs = [],
  actions = null,
  className = '',
}) => {
  return (
    <div className={`d-flex flex-wrap justify-content-between align-items-start gap-3 mb-4 ${className}`}>
      <div>
        {breadcrumbs.length > 0 && (
          <nav aria-label="breadcrumb" className="mb-1">
            <ol className="breadcrumb mb-0" style={{ fontSize: '0.75rem' }}>
              {breadcrumbs.map((b, idx) => (
                <li
                  key={idx}
                  className={`breadcrumb-item ${idx === breadcrumbs.length - 1 ? 'active text-muted' : ''}`}
                >
                  {b.link ? (
                    <a href={b.link} className="text-decoration-none text-muted">
                      {b.label}
                    </a>
                  ) : (
                    <span>{b.label}</span>
                  )}
                </li>
              ))}
            </ol>
          </nav>
        )}
        <div className="d-flex align-items-center gap-2">
          <h4 className="fw-bold mb-0 text-primary-emphasis tracking-tight">{title}</h4>
          {badge && <div>{badge}</div>}
        </div>
        {subtitle && <p className="text-muted text-sm mb-0 mt-1">{subtitle}</p>}
      </div>
      {actions && <div className="d-flex align-items-center gap-2 flex-wrap">{actions}</div>}
    </div>
  );
};

