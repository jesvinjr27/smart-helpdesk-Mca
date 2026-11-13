import React, { useEffect } from 'react';

export const ModernModal = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  size = 'md', // 'sm' | 'md' | 'lg' | 'xl'
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

  const sizeClass = size === 'lg' ? 'modal-lg' : size === 'xl' ? 'modal-xl' : '';

  return (
    <div
      className="modal-backdrop-custom"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className={`modal-content-custom ${sizeClass}`} role="dialog" aria-modal="true">
        <div className="modal-header-custom">
          <div>
            <h5 className="fw-bold mb-0 text-primary-emphasis fs-6">{title}</h5>
            {subtitle && <p className="text-xs text-muted mb-0 mt-0.5">{subtitle}</p>}
          </div>
          <button
            type="button"
            className="btn btn-sm btn-outline-secondary border-0 p-1 rounded-circle"
            onClick={onClose}
            aria-label="Close"
          >
            <i className="bi bi-x-lg fs-6"></i>
          </button>
        </div>

        <div className="modal-body-custom">{children}</div>

        {footer && <div className="modal-footer-custom">{footer}</div>}
      </div>
    </div>
  );
};

