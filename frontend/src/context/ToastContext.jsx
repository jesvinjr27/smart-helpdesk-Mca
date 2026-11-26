import React, { createContext, useContext, useState, useCallback, useRef } from 'react';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const activeMessagesRef = useRef(new Set());

  const removeToast = useCallback((id) => {
    setToasts((prev) => {
      const target = prev.find((t) => t.id === id);
      if (target) {
        activeMessagesRef.current.delete(target.message);
      }
      return prev.filter((t) => t.id !== id);
    });
  }, []);

  const addToast = useCallback(
    ({ message, type = 'error', duration = 3500 }) => {
      if (!message) return;

      const trimmedMessage = typeof message === 'string' ? message.trim() : JSON.stringify(message);

      // Deduplication: prevent stacking identical error notifications simultaneously
      if (activeMessagesRef.current.has(trimmedMessage)) {
        return;
      }

      activeMessagesRef.current.add(trimmedMessage);
      const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      const newToast = {
        id,
        message: trimmedMessage,
        type,
        duration,
      };

      setToasts((prev) => [...prev, newToast]);

      // Auto dismiss after duration
      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
    },
    [removeToast]
  );

  const showError = useCallback(
    (message, duration = 3500) => {
      addToast({ message, type: 'error', duration });
    },
    [addToast]
  );

  const showSuccess = useCallback(
    (message, duration = 3500) => {
      addToast({ message, type: 'success', duration });
    },
    [addToast]
  );

  const showInfo = useCallback(
    (message, duration = 3500) => {
      addToast({ message, type: 'info', duration });
    },
    [addToast]
  );

  const showWarning = useCallback(
    (message, duration = 3500) => {
      addToast({ message, type: 'warning', duration });
    },
    [addToast]
  );

  const getToastStyles = (type) => {
    switch (type) {
      case 'success':
        return {
          container: 'bg-emerald-600 border border-emerald-500/40 text-white',
          icon: <i className="bi bi-check-circle-fill text-white/95" />,
        };
      case 'warning':
        return {
          container: 'bg-amber-600 border border-amber-500/40 text-white',
          icon: <i className="bi bi-exclamation-triangle-fill text-white/95" />,
        };
      case 'info':
        return {
          container: 'bg-brand-primary border border-brand-secondary/40 text-white',
          icon: <i className="bi bi-info-circle-fill text-white/95" />,
        };
      case 'error':
      default:
        return {
          container: 'bg-[#DC2626] border border-red-700/40 text-white',
          icon: <i className="bi bi-exclamation-octagon-fill text-white/95" />,
        };
    }
  };

  return (
    <ToastContext.Provider value={{ addToast, showError, showSuccess, showInfo, showWarning, removeToast }}>
      {children}
      {/* Toast Notification Container */}
      <div
        aria-live="assertive"
        className="fixed top-4 left-4 right-4 sm:left-auto sm:right-6 sm:top-6 z-50 flex flex-col gap-2.5 pointer-events-none max-w-sm sm:max-w-md w-full"
      >
        {toasts.map((toast) => {
          const styles = getToastStyles(toast.type);
          return (
            <div
              key={toast.id}
              role="alert"
              className={`pointer-events-auto flex items-start gap-3 p-3.5 sm:p-4 rounded-xl shadow-xl backdrop-blur-sm animate-fadeIn transition-all duration-300 transform translate-y-0 ${styles.container}`}
            >
              {/* Type-Specific Icon */}
              <div className="flex-shrink-0 text-lg mt-0.5">
                {styles.icon}
              </div>

              {/* Notification Text */}
              <div className="flex-1 min-w-0 text-sm font-medium leading-snug">
                {toast.message}
              </div>

              {/* Manual Dismiss Button */}
              <button
                type="button"
                onClick={() => removeToast(toast.id)}
                className="flex-shrink-0 ml-1 text-white/80 hover:text-white transition-colors p-1 rounded-lg hover:bg-black/10 focus:outline-none"
                aria-label="Dismiss notification"
              >
                <i className="bi bi-x-lg text-xs" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
