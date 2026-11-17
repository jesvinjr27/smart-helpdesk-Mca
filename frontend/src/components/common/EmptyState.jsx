import React from 'react';

export const EmptyState = ({
  icon = 'bi-inbox',
  title = 'No items found',
  description = 'There are no records matching your current filter criteria.',
  action = null,
  className = '',
}) => {
  return (
    <div className={`text-center py-12 px-4 ${className}`}>
      <div className="w-14 h-14 mx-auto rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center mb-3 text-slate-400 dark:text-slate-500 text-2xl shadow-xs">
        <i className={`bi ${icon}`} />
      </div>
      <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200 mb-1">
        {title}
      </h3>
      <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto mb-4 leading-relaxed">
        {description}
      </p>
      {action && <div className="inline-flex justify-center">{action}</div>}
    </div>
  );
};
