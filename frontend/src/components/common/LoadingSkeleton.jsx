import React from 'react';

export const TableSkeleton = ({ rows = 5, cols = 6 }) => {
  return (
    <div className="p-4 space-y-3.5">
      {Array.from({ length: rows }).map((_, rIdx) => (
        <div
          key={rIdx}
          className="flex items-center gap-3 py-3 border-b border-slate-100 dark:border-slate-800/80 last:border-0"
        >
          {Array.from({ length: cols }).map((_, cIdx) => (
            <div
              key={cIdx}
              className="h-4 bg-slate-200 dark:bg-slate-700/60 rounded animate-pulse"
              style={{
                width: cIdx === 0 ? '12%' : cIdx === 1 ? '32%' : '14%',
              }}
            />
          ))}
        </div>
      ))}
    </div>
  );
};

export const CardSkeleton = ({ height = '140px', className = '' }) => {
  return (
    <div
      className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-3 ${className}`}
    >
      <div className="flex justify-between items-center">
        <div className="h-4 bg-slate-200 dark:bg-slate-700/60 rounded w-1/3 animate-pulse" />
        <div className="w-9 h-9 rounded-lg bg-slate-200 dark:bg-slate-700/60 animate-pulse" />
      </div>
      <div className="h-7 bg-slate-200 dark:bg-slate-700/60 rounded w-1/2 animate-pulse" />
      <div className="h-3.5 bg-slate-100 dark:bg-slate-800 rounded w-3/4 animate-pulse pt-2" />
    </div>
  );
};

export const LineSkeleton = ({ width = '100%', height = '16px', className = '' }) => {
  return (
    <div
      className={`bg-slate-200 dark:bg-slate-700/60 rounded animate-pulse ${className}`}
      style={{ width, height }}
    />
  );
};
