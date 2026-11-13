import React from 'react';

export const TableSkeleton = ({ rows = 5, cols = 6 }) => {
  return (
    <div className="p-3">
      {Array.from({ length: rows }).map((_, rIdx) => (
        <div key={rIdx} className="d-flex align-items-center gap-3 py-3 border-bottom border-subtle">
          {Array.from({ length: cols }).map((_, cIdx) => (
            <div
              key={cIdx}
              className="skeleton-shimmer"
              style={{
                height: '18px',
                width: cIdx === 0 ? '12%' : cIdx === 1 ? '30%' : '14%',
              }}
            ></div>
          ))}
        </div>
      ))}
    </div>
  );
};

export const CardSkeleton = ({ height = '140px', className = '' }) => {
  return (
    <div className={`card p-4 ${className}`}>
      <div className="d-flex justify-content-between mb-3">
        <div className="skeleton-shimmer" style={{ width: '40%', height: '16px' }}></div>
        <div className="skeleton-shimmer rounded-circle" style={{ width: '32px', height: '32px' }}></div>
      </div>
      <div className="skeleton-shimmer mb-2" style={{ width: '60%', height: '28px' }}></div>
      <div className="skeleton-shimmer" style={{ width: '80%', height: '14px' }}></div>
    </div>
  );
};

export const LineSkeleton = ({ width = '100%', height = '16px', className = '' }) => {
  return (
    <div
      className={`skeleton-shimmer ${className}`}
      style={{ width, height }}
    ></div>
  );
};

