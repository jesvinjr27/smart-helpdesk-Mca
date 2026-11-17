import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const INITIAL_NOTIFICATIONS = [
  {
    id: 1,
    title: 'SLA Breach Warning',
    message: 'Ticket #TK-1004 has less than 30 mins before response SLA breach.',
    type: 'danger',
    time: '5m ago',
    read: false,
    link: '/sla',
  },
  {
    id: 2,
    title: 'AI Copilot Ready',
    message: 'Local FAISS vector store completed synchronization for knowledge base.',
    type: 'ai',
    time: '24m ago',
    read: false,
    link: '/knowledge-base',
  },
  {
    id: 3,
    title: 'New High Priority Ticket',
    message: 'Finance team reported payroll portal connection failure.',
    type: 'warning',
    time: '1h ago',
    read: true,
    link: '/tickets',
  },
];

export const NotificationDropdown = () => {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleNotificationClick = (n) => {
    setNotifications((prev) =>
      prev.map((item) => (item.id === n.id ? { ...item, read: true } : item))
    );
    setOpen(false);
    if (n.link) navigate(n.link);
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'danger':
        return {
          icon: 'bi-exclamation-octagon-fill',
          bg: 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400',
        };
      case 'warning':
        return {
          icon: 'bi-clock-history',
          bg: 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400',
        };
      case 'ai':
        return {
          icon: 'bi-stars',
          bg: 'bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400',
        };
      default:
        return {
          icon: 'bi-bell-fill',
          bg: 'bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400',
        };
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        className="relative p-2 rounded-xl text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        onClick={() => setOpen(!open)}
        title="Notifications"
      >
        <i className="bi bi-bell text-lg" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-rose-500 rounded-full border-2 border-white dark:border-slate-900">
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 max-w-[calc(100vw-24px)] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl z-50 overflow-hidden animate-scaleUp">
          <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Notifications
              </span>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400 rounded-full">
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllAsRead}
                className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/80">
            {notifications.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                No notifications right now
              </div>
            ) : (
              notifications.map((n) => {
                const iconMeta = getTypeIcon(n.type);
                return (
                  <button
                    key={n.id}
                    type="button"
                    onClick={() => handleNotificationClick(n)}
                    className={`w-full p-3.5 flex items-start gap-3 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50 ${
                      !n.read ? 'bg-blue-50/40 dark:bg-blue-950/20' : ''
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-sm ${iconMeta.bg}`}
                    >
                      <i className={`bi ${iconMeta.icon}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <span className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                          {n.title}
                        </span>
                        <span className="text-[10px] text-slate-400 flex-shrink-0">
                          {n.time}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                        {n.message}
                      </p>
                    </div>
                    {!n.read && (
                      <span className="w-2 h-2 rounded-full bg-blue-600 flex-shrink-0 mt-1.5" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
