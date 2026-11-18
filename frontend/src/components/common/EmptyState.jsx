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
      <div className="w-14 h-14 mx-auto rounded-full bg-brand-secondary/15 border border-brand-secondary/30 flex items-center justify-center mb-3 text-brand-primary text-2xl shadow-subtle">
        <i className={`bi ${icon}`} />
      </div>
      <h3 className="text-base font-semibold text-brand-primary mb-1">
        {title}
      </h3>
      <p className="text-xs sm:text-sm text-brand-secondary max-w-sm mx-auto mb-4 leading-relaxed">
        {description}
      </p>
      {action && <div className="inline-flex justify-center">{action}</div>}
    </div>
  );
};
