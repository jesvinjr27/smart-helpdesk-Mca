import React, { useEffect } from 'react';

const SIZE_CLASSES = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
};

export const ModernModal = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  size = 'md',
}) => {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClass = SIZE_CLASSES[size] || SIZE_CLASSES.md;

  return (
    <div
      className="fixed inset-0 bg-brand-primary/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={`w-full ${sizeClass} card-glow overflow-hidden flex flex-col max-h-[90vh] max-h-[90dvh] animate-scaleUp`}
        role="dialog"
        aria-modal="true"
      >
        <div className="px-5 py-4 border-b border-brand-primary/15 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-base font-bold text-brand-primary truncate">
              {title}
            </h3>
            {subtitle && (
              <p className="text-xs text-brand-secondary mt-0.5 truncate">
                {subtitle}
              </p>
            )}
          </div>
          <button
            type="button"
            className="p-1.5 rounded-lg text-brand-secondary hover:text-brand-primary hover:bg-brand-secondary/15 transition-colors flex-shrink-0"
            onClick={onClose}
            aria-label="Close"
          >
            <i className="bi bi-x-lg text-sm" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto max-h-[calc(85vh-130px)] text-sm text-brand-primary">
          {children}
        </div>

        {footer && (
          <div className="px-5 py-3.5 border-t border-brand-primary/15 bg-app-background/80 flex items-center justify-end gap-2.5">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
