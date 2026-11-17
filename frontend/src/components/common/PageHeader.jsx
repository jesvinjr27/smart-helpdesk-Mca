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
    <div className={`flex flex-wrap justify-between items-start gap-4 mb-6 ${className}`}>
      <div className="min-w-0">
        {breadcrumbs.length > 0 && (
          <nav aria-label="breadcrumb" className="mb-1.5">
            <ol className="flex items-center flex-wrap gap-1.5 text-xs text-slate-500 dark:text-slate-400">
              {breadcrumbs.map((b, idx) => (
                <li key={idx} className="flex items-center gap-1.5">
                  {idx > 0 && <span className="text-slate-400 dark:text-slate-600">/</span>}
                  {b.link ? (
                    <a
                      href={b.link}
                      className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                    >
                      {b.label}
                    </a>
                  ) : (
                    <span className="font-medium text-slate-700 dark:text-slate-300">
                      {b.label}
                    </span>
                  )}
                </li>
              ))}
            </ol>
          </nav>
        )}

        <div className="flex items-center gap-2.5 flex-wrap">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            {title}
          </h1>
          {badge && <div className="flex-shrink-0">{badge}</div>}
        </div>

        {subtitle && (
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
            {subtitle}
          </p>
        )}
      </div>

      {actions && (
        <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap flex-shrink-0">
          {actions}
        </div>
      )}
    </div>
  );
};
