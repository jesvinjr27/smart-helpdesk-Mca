import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import { NotificationDropdown } from '../components/common/NotificationDropdown';

export const AppLayout = () => {
  const { user, logout, hasRole } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  // Close mobile drawer on route navigation
  React.useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const getPageTitle = () => {
    const path = location.pathname;
    if (path.startsWith('/dashboard')) return 'Dashboard Overview';
    if (path.startsWith('/tickets/new')) return 'New Ticket Request';
    if (path.startsWith('/tickets/')) return 'Ticket Incident Details';
    if (path.startsWith('/tickets')) return 'Tickets Management';
    if (path.startsWith('/knowledge-base')) return 'Knowledge Base';
    if (path.startsWith('/ai-assistant')) return 'AI Copilot Assistant';
    if (path.startsWith('/sla')) return 'SLA & Risk Monitoring';
    if (path.startsWith('/admin/users')) return 'Users & Access Control';
    if (path.startsWith('/admin/ai-models')) return 'AI Subsystems & Model Performance';
    if (path.startsWith('/admin/audit-logs')) return 'Security & Audit Logs';
    return 'Smart Helpdesk';
  };

  return (
    <div className="app-container">
      {/* Mobile Backdrop Overlay */}
      <div
        className={`sidebar-overlay ${mobileOpen ? 'active' : ''}`}
        onClick={() => setMobileOpen(false)}
      ></div>

      {/* Modern Sidebar */}
      <aside
        className={`app-sidebar ${collapsed ? 'collapsed' : ''} ${
          mobileOpen ? 'mobile-open' : ''
        }`}
      >
        {/* Sidebar Header */}
        <div className="sidebar-header">
          <NavLink to="/dashboard" className="sidebar-brand">
            <div className="brand-icon-box">
              <i className="bi bi-shield-check fs-5"></i>
            </div>
            {!collapsed && (
              <div className="brand-text-wrap">
                <span className="brand-title">SmartHelpdesk</span>
                <span className="brand-tag">AI-Powered Hub</span>
              </div>
            )}
          </NavLink>

          <button
            type="button"
            className="btn btn-sm btn-outline-secondary border-0 text-muted p-1 d-none d-lg-flex"
            onClick={() => setCollapsed(!collapsed)}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <i className={`bi ${collapsed ? 'bi-chevron-double-right' : 'bi-chevron-double-left'}`}></i>
          </button>
        </div>

        {/* Sidebar Nav Items */}
        <div className="sidebar-nav">
          {!collapsed && <div className="nav-section-title">Operations</div>}
          
          <NavLink
            to="/dashboard"
            title="Dashboard"
            className={({ isActive }) => `nav-item-link ${isActive ? 'active' : ''}`}
          >
            <i className="bi bi-grid-1x2"></i>
            {!collapsed && <span>Dashboard</span>}
          </NavLink>

          <NavLink
            to="/tickets"
            end
            title="All Tickets"
            className={({ isActive }) => `nav-item-link ${isActive ? 'active' : ''}`}
          >
            <i className="bi bi-ticket-detailed"></i>
            {!collapsed && <span>Tickets</span>}
          </NavLink>

          <NavLink
            to="/tickets/new"
            title="Create New Ticket"
            className={({ isActive }) => `nav-item-link ${isActive ? 'active' : ''}`}
          >
            <i className="bi bi-plus-circle"></i>
            {!collapsed && <span>New Ticket</span>}
          </NavLink>

          {!collapsed && <div className="nav-section-title">Knowledge & Intelligence</div>}
          
          <NavLink
            to="/knowledge-base"
            title="Knowledge Base"
            className={({ isActive }) => `nav-item-link ${isActive ? 'active' : ''}`}
          >
            <i className="bi bi-book"></i>
            {!collapsed && <span>Knowledge Base</span>}
          </NavLink>

          <NavLink
            to="/ai-assistant"
            title="AI Copilot"
            className={({ isActive }) => `nav-item-link ${isActive ? 'active' : ''}`}
          >
            <i className="bi bi-robot text-primary"></i>
            {!collapsed && <span>AI Copilot</span>}
            {!collapsed && <span className="nav-pill-badge">RAG</span>}
          </NavLink>

          {hasRole(['AGENT', 'LEAD', 'ORG_ADMIN', 'SYS_ADMIN']) && (
            <>
              {!collapsed && <div className="nav-section-title">Service & SLA</div>}
              <NavLink
                to="/sla"
                title="SLA & Risk Alerts"
                className={({ isActive }) => `nav-item-link ${isActive ? 'active' : ''}`}
              >
                <i className="bi bi-stopwatch"></i>
                {!collapsed && <span>SLA & Risk Alerts</span>}
              </NavLink>
            </>
          )}

          {hasRole(['LEAD', 'ORG_ADMIN', 'SYS_ADMIN']) && (
            <>
              {!collapsed && <div className="nav-section-title">Administration</div>}
              {hasRole(['ORG_ADMIN', 'SYS_ADMIN']) && (
                <NavLink
                  to="/admin/users"
                  title="Users & Roles"
                  className={({ isActive }) => `nav-item-link ${isActive ? 'active' : ''}`}
                >
                  <i className="bi bi-people"></i>
                  {!collapsed && <span>Users & Roles</span>}
                </NavLink>
              )}
              <NavLink
                to="/admin/ai-models"
                title="AI Model Metrics"
                className={({ isActive }) => `nav-item-link ${isActive ? 'active' : ''}`}
              >
                <i className="bi bi-cpu"></i>
                {!collapsed && <span>AI Subsystems</span>}
              </NavLink>
              {hasRole(['ORG_ADMIN', 'SYS_ADMIN']) && (
                <NavLink
                  to="/admin/audit-logs"
                  title="Audit Logs"
                  className={({ isActive }) => `nav-item-link ${isActive ? 'active' : ''}`}
                >
                  <i className="bi bi-journal-text"></i>
                  {!collapsed && <span>Audit Logs</span>}
                </NavLink>
              )}
            </>
          )}
        </div>

        {/* Sidebar Footer User Info */}
        <div className="sidebar-footer">
          <div className="d-flex align-items-center justify-content-between">
            <div className="d-flex align-items-center gap-2 overflow-hidden">
              <div
                className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold shadow-sm"
                style={{
                  width: '36px',
                  height: '36px',
                  background: 'var(--primary-gradient)',
                  fontSize: '0.85rem',
                  flexShrink: 0,
                }}
              >
                {user?.full_name ? user.full_name[0].toUpperCase() : 'U'}
              </div>
              {!collapsed && (
                <div className="overflow-hidden">
                  <div className="text-white text-sm fw-semibold text-truncate">
                    {user?.full_name || 'User'}
                  </div>
                  <div className="text-xs text-muted text-truncate">
                    {user?.roles?.[0] || 'REQUESTER'}
                  </div>
                </div>
              )}
            </div>

            {!collapsed && (
              <button
                onClick={logout}
                title="Sign Out"
                className="btn btn-sm btn-outline-secondary border-0 text-muted p-1.5 rounded-circle"
              >
                <i className="bi bi-box-arrow-right fs-5"></i>
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Main Container */}
      <div className={`app-main ${collapsed ? 'sidebar-collapsed' : ''}`}>
        {/* Top Navbar */}
        <header className="app-topbar">
          <div className="d-flex align-items-center gap-3">
            {/* Mobile Hamburger */}
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary d-lg-none border-0 p-1"
              onClick={() => setMobileOpen(true)}
              aria-label="Open navigation menu"
            >
              <i className="bi bi-list fs-4"></i>
            </button>

            {/* Current Page Title */}
            <div className="d-flex align-items-center gap-2">
              <span className="fw-bold fs-6 text-primary-emphasis d-none d-sm-inline">
                {getPageTitle()}
              </span>
              <span className="badge bg-surface-subtle text-muted border border-default px-2.5 py-1 text-xs fw-semibold">
                <i className="bi bi-building me-1 text-primary"></i>
                {user?.org_name || 'Organization'}
              </span>
            </div>
          </div>

          {/* Right Action Icons */}
          <div className="d-flex align-items-center gap-2.5">
            {/* Ask AI Copilot quick launcher */}
            <button
              onClick={() => navigate('/ai-assistant')}
              className="btn btn-sm btn-ai d-flex align-items-center gap-2 px-3 py-1.5 rounded-pill text-xs fw-semibold"
            >
              <i className="bi bi-stars"></i>
              <span className="d-none d-md-inline">Ask AI Copilot</span>
            </button>

            {/* Notification Bell Dropdown */}
            <NotificationDropdown />

            {/* Theme Switcher Toggle (Light / Dark) */}
            <button
              type="button"
              onClick={toggleTheme}
              className="btn btn-sm btn-outline-secondary border-0 rounded-circle p-2 text-secondary"
              style={{ width: '38px', height: '38px' }}
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
            >
              <i className={`bi ${theme === 'dark' ? 'bi-sun-fill text-warning' : 'bi-moon-stars text-secondary'} fs-5`}></i>
            </button>

            {/* User Profile Dropdown */}
            <div className="position-relative">
              <button
                type="button"
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="btn btn-sm p-1 border-0 d-flex align-items-center gap-2"
              >
                <div
                  className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold shadow-sm"
                  style={{
                    width: '34px',
                    height: '34px',
                    background: 'var(--primary-gradient)',
                    fontSize: '0.8rem',
                  }}
                >
                  {user?.full_name ? user.full_name[0].toUpperCase() : 'U'}
                </div>
                <div className="text-start d-none d-xl-block">
                  <div className="fw-semibold text-xs text-primary-emphasis line-clamp-1">
                    {user?.full_name}
                  </div>
                  <div className="text-muted" style={{ fontSize: '0.68rem' }}>
                    {user?.email}
                  </div>
                </div>
                <i className="bi bi-chevron-down text-muted" style={{ fontSize: '0.7rem' }}></i>
              </button>

              {userDropdownOpen && (
                <div
                  className="position-absolute end-0 mt-2 card shadow-lg border-default py-1"
                  style={{ width: '220px', zIndex: 1060, animation: 'scaleUp 150ms ease' }}
                  onMouseLeave={() => setUserDropdownOpen(false)}
                >
                  <div className="px-3 py-2 border-bottom border-subtle">
                    <div className="fw-bold text-xs text-primary-emphasis">{user?.full_name}</div>
                    <div className="text-muted" style={{ fontSize: '0.7rem' }}>{user?.email}</div>
                    <span className="badge bg-primary-subtle text-primary mt-1 text-xs">
                      {user?.roles?.[0] || 'REQUESTER'}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      setUserDropdownOpen(false);
                      navigate('/tickets');
                    }}
                    className="dropdown-item px-3 py-2 text-xs text-secondary d-flex align-items-center gap-2"
                  >
                    <i className="bi bi-ticket-perforated"></i>
                    <span>My Support Queue</span>
                  </button>
                  <button
                    onClick={() => {
                      setUserDropdownOpen(false);
                      toggleTheme();
                    }}
                    className="dropdown-item px-3 py-2 text-xs text-secondary d-flex align-items-center gap-2"
                  >
                    <i className={`bi ${theme === 'dark' ? 'bi-sun' : 'bi-moon'}`}></i>
                    <span>{theme === 'dark' ? 'Light Theme' : 'Dark Theme'}</span>
                  </button>
                  <div className="border-top border-subtle my-1"></div>
                  <button
                    onClick={logout}
                    className="dropdown-item px-3 py-2 text-xs text-danger d-flex align-items-center gap-2"
                  >
                    <i className="bi bi-box-arrow-right"></i>
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Dynamic Page Content */}
        <main className="content-body">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
