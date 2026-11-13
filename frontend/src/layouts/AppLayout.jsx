import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export const AppLayout = () => {
  const { user, logout, hasRole } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="d-flex min-vh-100">
      {/* Sidebar */}
      <aside className="app-sidebar">
        <div className="sidebar-header d-flex align-items-center justify-content-between">
          <div className="d-flex align-items-center gap-2">
            <div
              className="bg-primary text-white d-flex align-items-center justify-content-center rounded-3"
              style={{ width: '36px', height: '36px' }}
            >
              <i className="bi bi-shield-check fs-5"></i>
            </div>
            <div>
              <div className="fw-bold text-white fs-6">SmartHelpdesk</div>
              <div className="text-xs text-secondary">AI-Powered Hub</div>
            </div>
          </div>
        </div>

        <div className="sidebar-nav overflow-y-auto">
          <div className="nav-section-title">Operations</div>
          <NavLink
            to="/dashboard"
            className={({ isActive }) => `nav-item-link ${isActive ? 'active' : ''}`}
          >
            <i className="bi bi-speedometer2"></i>
            <span>Dashboard</span>
          </NavLink>
          <NavLink
            to="/tickets"
            end
            className={({ isActive }) => `nav-item-link ${isActive ? 'active' : ''}`}
          >
            <i className="bi bi-ticket-detailed"></i>
            <span>Tickets</span>
          </NavLink>
          <NavLink
            to="/tickets/new"
            className={({ isActive }) => `nav-item-link ${isActive ? 'active' : ''}`}
          >
            <i className="bi bi-plus-circle"></i>
            <span>New Ticket</span>
          </NavLink>

          <div className="nav-section-title">Knowledge & AI</div>
          <NavLink
            to="/knowledge-base"
            className={({ isActive }) => `nav-item-link ${isActive ? 'active' : ''}`}
          >
            <i className="bi bi-book"></i>
            <span>Knowledge Base</span>
          </NavLink>
          <NavLink
            to="/ai-assistant"
            className={({ isActive }) => `nav-item-link ${isActive ? 'active' : ''}`}
          >
            <i className="bi bi-robot"></i>
            <span>AI Copilot</span>
          </NavLink>

          {hasRole(['AGENT', 'LEAD', 'ORG_ADMIN', 'SYS_ADMIN']) && (
            <NavLink
              to="/sla"
              className={({ isActive }) => `nav-item-link ${isActive ? 'active' : ''}`}
            >
              <i className="bi bi-clock-history"></i>
              <span>SLA & Risk Alerts</span>
            </NavLink>
          )}

          {hasRole(['LEAD', 'ORG_ADMIN', 'SYS_ADMIN']) && (
            <>
              <div className="nav-section-title">Administration</div>
              {hasRole(['ORG_ADMIN', 'SYS_ADMIN']) && (
                <NavLink
                  to="/admin/users"
                  className={({ isActive }) => `nav-item-link ${isActive ? 'active' : ''}`}
                >
                  <i className="bi bi-people"></i>
                  <span>Users & Roles</span>
                </NavLink>
              )}
              <NavLink
                to="/admin/ai-models"
                className={({ isActive }) => `nav-item-link ${isActive ? 'active' : ''}`}
              >
                <i className="bi bi-cpu"></i>
                <span>AI Model Metrics</span>
              </NavLink>
              {hasRole(['ORG_ADMIN', 'SYS_ADMIN']) && (
                <NavLink
                  to="/admin/audit-logs"
                  className={({ isActive }) => `nav-item-link ${isActive ? 'active' : ''}`}
                >
                  <i className="bi bi-journal-text"></i>
                  <span>Audit Logs</span>
                </NavLink>
              )}
            </>
          )}
        </div>

        {/* User Card at Bottom of Sidebar */}
        <div className="p-3 border-top border-secondary border-opacity-25 bg-dark bg-opacity-50">
          <div className="d-flex align-items-center justify-content-between">
            <div className="d-flex align-items-center gap-2 overflow-hidden">
              <div
                className="rounded-circle bg-secondary text-white d-flex align-items-center justify-content-center fw-bold"
                style={{ width: '34px', height: '34px', flexShrink: 0 }}
              >
                {user?.full_name ? user.full_name[0].toUpperCase() : 'U'}
              </div>
              <div className="overflow-hidden">
                <div className="text-white text-sm fw-medium text-truncate">
                  {user?.full_name || 'User'}
                </div>
                <div className="text-xs text-secondary text-truncate">
                  {user?.roles?.[0] || 'REQUESTER'}
                </div>
              </div>
            </div>
            <button
              onClick={logout}
              title="Logout"
              className="btn btn-sm btn-outline-light border-0 text-secondary"
            >
              <i className="bi bi-box-arrow-right fs-5"></i>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="app-main">
        {/* Topbar */}
        <header className="app-topbar">
          <div className="d-flex align-items-center gap-3">
            <span className="badge bg-light text-dark border px-3 py-2 fw-semibold">
              <i className="bi bi-building me-1 text-primary"></i>
              {user?.org_name || 'Organization'}
            </span>
            {user?.department_name && (
              <span className="text-muted text-sm d-none d-md-inline">
                {user.department_name}
              </span>
            )}
          </div>

          <div className="d-flex align-items-center gap-3">
            <button
              onClick={() => navigate('/ai-assistant')}
              className="btn btn-sm btn-outline-primary d-flex align-items-center gap-2 px-3 py-1 rounded-pill"
            >
              <i className="bi bi-stars"></i>
              <span>Ask AI Copilot</span>
            </button>
            <div className="border-start ps-3 d-flex align-items-center gap-2">
              <div className="text-end d-none d-sm-block">
                <div className="fw-semibold text-sm">{user?.full_name}</div>
                <div className="text-xs text-muted">{user?.email}</div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="content-body">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
