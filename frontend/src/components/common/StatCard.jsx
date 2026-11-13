import React from 'react';

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
  return (
    <div className={`stat-card ${variant} ${className}`}>
      <div className="d-flex justify-content-between align-items-start">
        <div>
          <span className="stat-card-label">{title}</span>
          <div className="d-flex align-items-baseline gap-2">
            <h3 className="stat-card-value mb-0">{value}</h3>
            {pulse && <span className="pulse-danger" title="Active critical condition"></span>}
          </div>
        </div>
        <div className={`stat-card-icon ${variant}`}>
          <i className={`bi ${icon}`}></i>
        </div>
      </div>
      {(subtitle || trend) && (
        <div className="mt-3 pt-2 border-top border-subtle d-flex align-items-center justify-content-between text-xs text-muted">
          {subtitle && <span>{subtitle}</span>}
          {trend && (
            <span
              className={`stat-card-delta ${
                trend.isPositive
                  ? 'bg-success-subtle text-success'
                  : 'bg-danger-subtle text-danger'
              }`}
            >
              <i
                className={`bi ${trend.isPositive ? 'bi-arrow-up-short' : 'bi-arrow-down-short'}`}
              ></i>
              {trend.text}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

