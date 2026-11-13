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

  return (
    <div className="position-relative" ref={dropdownRef}>
      <button
        type="button"
        className="btn btn-sm btn-outline-secondary position-relative border-0 rounded-circle p-2 text-secondary"
        style={{ width: '38px', height: '38px' }}
        onClick={() => setOpen(!open)}
        title="Notifications"
      >
        <i className="bi bi-bell fs-5"></i>
        {unreadCount > 0 && (
          <span
            className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger"
            style={{ fontSize: '0.65rem', padding: '0.2rem 0.4rem' }}
          >
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          className="position-absolute end-0 mt-2 card shadow-lg border-default"
          style={{ width: '340px', zIndex: 1060, animation: 'scaleUp 180ms ease' }}
        >
          <div className="card-header bg-transparent py-2.5 px-3 d-flex align-items-center justify-content-between">
            <span className="fw-bold text-sm">Notifications</span>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllAsRead}
                className="btn btn-link btn-sm p-0 text-xs text-primary text-decoration-none"
              >
                Mark all read
              </button>
            )}
          </div>
          <div className="list-group list-group-flush overflow-y-auto" style={{ maxHeight: '320px' }}>
            {notifications.length === 0 ? (
              <div className="text-center py-4 text-muted text-xs">
                No notifications right now.
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => handleNotificationClick(n)}
                  className={`list-group-item list-group-item-action p-3 cursor-pointer border-bottom border-subtle ${
                    !n.read ? 'bg-surface-subtle' : ''
                  }`}
                  style={{ backgroundColor: !n.read ? 'var(--bg-surface-subtle)' : 'var(--bg-surface)' }}
                >
                  <div className="d-flex align-items-start gap-2.5">
                    <span
                      className={`badge-dot mt-1.5 ${
                        n.type === 'danger'
                          ? 'bg-danger'
                          : n.type === 'ai'
                          ? 'bg-primary'
                          : 'bg-warning'
                      }`}
                      style={{ width: '8px', height: '8px' }}
                    ></span>
                    <div className="flex-grow-1 overflow-hidden">
                      <div className="d-flex justify-content-between align-items-center mb-0.5">
                        <span className={`text-xs fw-semibold ${!n.read ? 'text-primary' : 'text-primary-emphasis'}`}>
                          {n.title}
                        </span>
                        <span className="text-muted" style={{ fontSize: '0.7rem' }}>
                          {n.time}
                        </span>
                      </div>
                      <p className="text-muted text-xs mb-0 line-clamp-2" style={{ lineHeight: 1.35 }}>
                        {n.message}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

