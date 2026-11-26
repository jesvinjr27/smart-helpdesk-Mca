import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { NotificationDropdown } from '../components/common/NotificationDropdown';

export const AppLayout = () => {
  const { user, logout, hasRole } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const handleToggleCollapse = () => {
    setCollapsed((prev) => {
      const next = !prev;
      setTimeout(() => {
        window.dispatchEvent(new Event('resize'));
      }, 260);
      return next;
    });
  };

  // Close mobile drawer on route navigation
  useEffect(() => {
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
    <div className="min-h-screen min-h-[100dvh] w-full max-w-full bg-app-background flex overflow-x-hidden relative text-brand-primary font-sans">
      {/* Mobile Backdrop Overlay */}
      <div
        className={`fixed inset-0 bg-brand-primary/50 backdrop-blur-xs z-40 transition-opacity duration-300 lg:hidden ${
          mobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setMobileOpen(false)}
        aria-hidden="true"
      />

      {/* Official Dark Blue Sidebar (rgb(53, 88, 114)) */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col bg-brand-primary text-white border-r border-brand-primary/30 transition-all duration-300 ease-in-out shadow-xl lg:shadow-none ${
          collapsed ? 'w-[76px]' : 'w-[270px]'
        } ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* Sidebar Header */}
        {collapsed ? (
          <div className="h-16 w-full flex items-center justify-center border-b border-white/10 flex-shrink-0">
            <button
              type="button"
              onClick={handleToggleCollapse}
              className="w-10 h-10 rounded-xl bg-white p-1 flex items-center justify-center shadow-sm hover:scale-105 transition-all cursor-pointer focus:outline-none"
              title="Expand sidebar"
            >
              <img src="/logo.png" alt="SmartHelpdesk" className="w-8 h-8 object-contain" />
            </button>
          </div>
        ) : (
          <div className="h-16 px-4 border-b border-white/10 flex items-center justify-between flex-shrink-0">
            <NavLink to="/dashboard" className="flex items-center gap-3 overflow-hidden group">
              <div className="w-10 h-10 rounded-xl bg-white p-1 flex items-center justify-center shadow-sm flex-shrink-0 group-hover:scale-105 transition-transform">
                <img src="/logo.png" alt="SmartHelpdesk" className="w-8 h-8 object-contain" />
              </div>
              <div className="flex flex-col overflow-hidden">
                <span className="font-bold text-sm tracking-tight text-white truncate">
                  SmartHelpdesk
                </span>
                <span className="text-[10px] font-medium text-brand-accent tracking-wider uppercase">
                  AI-Powered Hub
                </span>
              </div>
            </NavLink>

            <button
              type="button"
              className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors hidden lg:flex items-center justify-center cursor-pointer"
              onClick={handleToggleCollapse}
              title="Collapse sidebar"
            >
              <i className="bi bi-chevron-double-left text-sm" />
            </button>
          </div>
        )}

        {/* Sidebar Nav Items */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {!collapsed && (
            <div className="px-3 pt-2 pb-1 text-[11px] font-semibold tracking-wider text-brand-accent/80 uppercase">
              Operations
            </div>
          )}

          <NavLink
            to="/dashboard"
            title="Dashboard"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-brand-accent text-brand-primary font-semibold shadow-sm'
                  : 'text-white/80 hover:text-white hover:bg-white/10'
              }`
            }
          >
            <i className="bi bi-grid-1x2 text-base flex-shrink-0" />
            {!collapsed && <span className="truncate">Dashboard</span>}
          </NavLink>

          <NavLink
            to="/tickets"
            end
            title="All Tickets"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-brand-accent text-brand-primary font-semibold shadow-sm'
                  : 'text-white/80 hover:text-white hover:bg-white/10'
              }`
            }
          >
            <i className="bi bi-ticket-detailed text-base flex-shrink-0" />
            {!collapsed && <span className="truncate">Tickets</span>}
          </NavLink>

          <NavLink
            to="/tickets/new"
            title="Create New Ticket"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-brand-accent text-brand-primary font-semibold shadow-sm'
                  : 'text-white/80 hover:text-white hover:bg-white/10'
              }`
            }
          >
            <i className="bi bi-plus-circle text-base flex-shrink-0" />
            {!collapsed && <span className="truncate">New Ticket</span>}
          </NavLink>

          {!collapsed && (
            <div className="px-3 pt-4 pb-1 text-[11px] font-semibold tracking-wider text-brand-accent/80 uppercase">
              Knowledge & Intelligence
            </div>
          )}

          <NavLink
            to="/knowledge-base"
            title="Knowledge Base"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-brand-accent text-brand-primary font-semibold shadow-sm'
                  : 'text-white/80 hover:text-white hover:bg-white/10'
              }`
            }
          >
            <i className="bi bi-book text-base flex-shrink-0" />
            {!collapsed && <span className="truncate">Knowledge Base</span>}
          </NavLink>

          <NavLink
            to="/ai-assistant"
            title="AI Copilot"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-brand-accent text-brand-primary font-semibold shadow-sm'
                  : 'text-white/80 hover:text-white hover:bg-white/10'
              }`
            }
          >
            <i className="bi bi-robot text-base text-brand-accent flex-shrink-0" />
            {!collapsed && <span className="truncate">AI Copilot</span>}
            {!collapsed && (
              <span className="ml-auto px-1.5 py-0.5 text-[10px] font-bold rounded-md bg-white/20 text-white border border-white/20">
                RAG
              </span>
            )}
          </NavLink>

          {hasRole(['AGENT', 'LEAD', 'ORG_ADMIN', 'SYS_ADMIN']) && (
            <>
              {!collapsed && (
                <div className="px-3 pt-4 pb-1 text-[11px] font-semibold tracking-wider text-brand-accent/80 uppercase">
                  Service & SLA
                </div>
              )}
              <NavLink
                to="/sla"
                title="SLA & Risk Alerts"
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-brand-accent text-brand-primary font-semibold shadow-sm'
                      : 'text-white/80 hover:text-white hover:bg-white/10'
                  }`
                }
              >
                <i className="bi bi-stopwatch text-base flex-shrink-0" />
                {!collapsed && <span className="truncate">SLA & Risk Alerts</span>}
              </NavLink>
            </>
          )}

          {hasRole(['LEAD', 'ORG_ADMIN', 'SYS_ADMIN']) && (
            <>
              {!collapsed && (
                <div className="px-3 pt-4 pb-1 text-[11px] font-semibold tracking-wider text-brand-accent/80 uppercase">
                  Administration
                </div>
              )}
              {hasRole(['ORG_ADMIN', 'SYS_ADMIN']) && (
                <NavLink
                  to="/admin/users"
                  title="Users & Roles"
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-brand-accent text-brand-primary font-semibold shadow-sm'
                        : 'text-white/80 hover:text-white hover:bg-white/10'
                    }`
                  }
                >
                  <i className="bi bi-people text-base flex-shrink-0" />
                  {!collapsed && <span className="truncate">Users & Roles</span>}
                </NavLink>
              )}
              <NavLink
                to="/admin/ai-models"
                title="AI Model Metrics"
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-brand-accent text-brand-primary font-semibold shadow-sm'
                      : 'text-white/80 hover:text-white hover:bg-white/10'
                  }`
                }
              >
                <i className="bi bi-cpu text-base flex-shrink-0" />
                {!collapsed && <span className="truncate">AI Subsystems</span>}
              </NavLink>
              {hasRole(['ORG_ADMIN', 'SYS_ADMIN']) && (
                <NavLink
                  to="/admin/audit-logs"
                  title="Audit Logs"
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-brand-accent text-brand-primary font-semibold shadow-sm'
                        : 'text-white/80 hover:text-white hover:bg-white/10'
                    }`
                  }
                >
                  <i className="bi bi-journal-text text-base flex-shrink-0" />
                  {!collapsed && <span className="truncate">Audit Logs</span>}
                </NavLink>
              )}
            </>
          )}

          {/* Collapse / Expand Toggle Item for Desktop */}
          <div className="pt-2 hidden lg:block border-t border-white/10 mt-2">
            <button
              type="button"
              onClick={handleToggleCollapse}
              className={`flex items-center gap-3 w-full px-3 py-2 rounded-xl text-xs font-medium text-white/70 hover:text-white hover:bg-white/10 transition-all cursor-pointer ${
                collapsed ? 'justify-center' : ''
              }`}
              title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              <i className={`bi ${collapsed ? 'bi-chevron-double-right' : 'bi-chevron-double-left'} text-sm flex-shrink-0`} />
              {!collapsed && <span className="truncate">Collapse Sidebar</span>}
            </button>
          </div>
        </div>

        {/* Sidebar Footer User Info */}
        <div className="p-3.5 border-t border-white/10 flex items-center justify-between flex-shrink-0 bg-brand-primary">
          <NavLink
            to="/profile"
            className="flex items-center gap-2.5 overflow-hidden min-w-0 group hover:opacity-90 transition-opacity"
            title="View Profile & Settings"
          >
            <div className="w-9 h-9 rounded-xl bg-brand-secondary flex items-center justify-center text-white font-bold text-sm shadow-sm flex-shrink-0 overflow-hidden border border-white/20">
              {user?.avatar_url ? (
                <img src={user.avatar_url} alt={user.full_name} className="w-full h-full object-cover" />
              ) : (
                user?.full_name ? user.full_name[0].toUpperCase() : 'U'
              )}
            </div>
            {!collapsed && (
              <div className="overflow-hidden min-w-0">
                <div className="text-white text-xs font-semibold truncate group-hover:underline">
                  {user?.full_name || 'User'}
                </div>
                <div className="text-[10px] text-brand-accent truncate">
                  {user?.roles?.[0] || 'REQUESTER'}
                </div>
              </div>
            )}
          </NavLink>

          {!collapsed && (
            <button
              onClick={logout}
              title="Sign Out"
              className="p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors flex-shrink-0 cursor-pointer"
            >
              <i className="bi bi-box-arrow-right text-lg" />
            </button>
          )}
        </div>
      </aside>

      {/* Main Container */}
      <div
        className={`flex flex-col min-h-screen min-h-[100dvh] pt-16 transition-all duration-300 ease-in-out min-w-0 flex-1 ${
          collapsed
            ? 'lg:ml-[76px] lg:w-[calc(100%-76px)] lg:max-w-[calc(100%-76px)]'
            : 'lg:ml-[270px] lg:w-[calc(100%-270px)] lg:max-w-[calc(100%-270px)]'
        } w-full max-w-full ml-0 bg-app-background`}
      >
        {/* Fixed Top Navbar */}
        <header
          className={`fixed top-0 right-0 z-30 h-16 bg-app-background/95 backdrop-blur-md border-b border-brand-primary/15 px-3 sm:px-6 flex items-center justify-between transition-all duration-300 ease-in-out ${
            collapsed ? 'left-0 lg:left-[76px]' : 'left-0 lg:left-[270px]'
          }`}
        >
          <div className="flex items-center gap-2 sm:gap-3 overflow-hidden min-w-0">
            {/* Desktop Sidebar Toggle */}
            <button
              type="button"
              className="p-1.5 rounded-lg text-brand-primary hover:bg-brand-secondary/20 hidden lg:flex items-center justify-center transition-colors cursor-pointer flex-shrink-0"
              onClick={handleToggleCollapse}
              title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              aria-label="Toggle navigation sidebar"
            >
              <i className={`bi ${collapsed ? 'bi-layout-sidebar-inset' : 'bi-layout-sidebar'} text-lg`} />
            </button>

            {/* Mobile Hamburger */}
            <button
              type="button"
              className="p-1.5 rounded-lg text-brand-primary hover:bg-brand-secondary/20 lg:hidden flex-shrink-0"
              onClick={() => setMobileOpen(true)}
              aria-label="Open navigation menu"
            >
              <i className="bi bi-list text-2xl" />
            </button>

            {/* Current Page Title */}
            <div className="flex items-center gap-2 overflow-hidden min-w-0">
              <span className="font-bold text-sm sm:text-base text-brand-primary hidden sm:inline truncate">
                {getPageTitle()}
              </span>
              <span
                className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-brand-secondary/15 text-brand-primary border border-brand-secondary/30 truncate max-w-[130px] sm:max-w-[180px]"
                title={user?.org_name || 'Organization'}
              >
                <i className="bi bi-building text-brand-primary text-xs flex-shrink-0" />
                <span className="truncate">{user?.org_name || 'Organization'}</span>
              </span>
            </div>
          </div>

          {/* Right Action Icons */}
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            {/* Ask AI Copilot quick launcher */}
            <button
              onClick={() => navigate('/ai-assistant')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-white bg-brand-primary hover:bg-brand-primary/90 shadow-subtle transition-all flex-shrink-0"
            >
              <i className="bi bi-stars text-brand-accent" />
              <span className="hidden md:inline">Ask AI Copilot</span>
            </button>

            {/* Notification Bell Dropdown */}
            <NotificationDropdown />

            {/* User Profile Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="p-1 rounded-xl flex items-center gap-2 hover:bg-brand-secondary/15 transition-colors cursor-pointer"
                title="Account menu"
              >
                <div className="w-8 h-8 rounded-xl bg-brand-primary flex items-center justify-center text-white font-bold text-xs shadow-xs flex-shrink-0 overflow-hidden border border-brand-primary/20">
                  {user?.avatar_url ? (
                    <img src={user.avatar_url} alt={user.full_name} className="w-full h-full object-cover" />
                  ) : (
                    user?.full_name ? user.full_name[0].toUpperCase() : 'U'
                  )}
                </div>
                <div className="text-left hidden xl:block">
                  <div className="font-semibold text-xs text-brand-primary truncate max-w-[120px]">
                    {user?.full_name}
                  </div>
                  <div className="text-[10px] text-brand-secondary truncate max-w-[120px]">
                    {user?.email}
                  </div>
                </div>
                <i className="bi bi-chevron-down text-brand-secondary text-xs hidden sm:inline" />
              </button>

              {userDropdownOpen && (
                <div
                  className="absolute right-0 mt-2 w-60 card-glow py-1.5 z-50 animate-scaleUp overflow-hidden bg-white/95 backdrop-blur-md rounded-2xl border border-brand-primary/20 shadow-xl"
                  onMouseLeave={() => setUserDropdownOpen(false)}
                >
                  <div className="px-4 py-2.5 border-b border-brand-primary/10 bg-brand-secondary/5">
                    <div className="font-bold text-xs text-brand-primary truncate">
                      {user?.full_name}
                    </div>
                    <div className="text-[11px] text-brand-secondary truncate">{user?.email}</div>
                    <span className="inline-block mt-1 px-2 py-0.5 text-[10px] font-semibold bg-brand-secondary/20 text-brand-primary rounded-full border border-brand-secondary/40">
                      {user?.roles?.[0] || 'REQUESTER'}
                    </span>
                  </div>

                  <div className="py-1">
                    {/* 1. My Profile */}
                    <button
                      type="button"
                      onClick={() => {
                        setUserDropdownOpen(false);
                        navigate('/profile/personal-information');
                      }}
                      className="w-full px-4 py-2 text-xs text-brand-primary hover:bg-brand-secondary/15 flex items-center gap-2.5 text-left transition-colors cursor-pointer"
                    >
                      <i className="bi bi-person-circle text-brand-secondary text-sm" />
                      <span>My Profile</span>
                    </button>

                    {/* 2. Account Settings */}
                    <button
                      type="button"
                      onClick={() => {
                        setUserDropdownOpen(false);
                        navigate('/profile/account');
                      }}
                      className="w-full px-4 py-2 text-xs text-brand-primary hover:bg-brand-secondary/15 flex items-center gap-2.5 text-left transition-colors cursor-pointer"
                    >
                      <i className="bi bi-gear-wide-connected text-brand-secondary text-sm" />
                      <span>Account Settings</span>
                    </button>

                    {/* 3. Security */}
                    <button
                      type="button"
                      onClick={() => {
                        setUserDropdownOpen(false);
                        navigate('/profile/security');
                      }}
                      className="w-full px-4 py-2 text-xs text-brand-primary hover:bg-brand-secondary/15 flex items-center gap-2.5 text-left transition-colors cursor-pointer"
                    >
                      <i className="bi bi-shield-check text-brand-secondary text-sm" />
                      <span>Security</span>
                    </button>

                    {/* 4. Notifications */}
                    <button
                      type="button"
                      onClick={() => {
                        setUserDropdownOpen(false);
                        navigate('/profile/notifications');
                      }}
                      className="w-full px-4 py-2 text-xs text-brand-primary hover:bg-brand-secondary/15 flex items-center gap-2.5 text-left transition-colors cursor-pointer"
                    >
                      <i className="bi bi-bell text-brand-secondary text-sm" />
                      <span>Notifications</span>
                    </button>

                    {/* 5. My Activity */}
                    <button
                      type="button"
                      onClick={() => {
                        setUserDropdownOpen(false);
                        navigate('/profile/activity');
                      }}
                      className="w-full px-4 py-2 text-xs text-brand-primary hover:bg-brand-secondary/15 flex items-center gap-2.5 text-left transition-colors cursor-pointer"
                    >
                      <i className="bi bi-clock-history text-brand-secondary text-sm" />
                      <span>My Activity</span>
                    </button>
                  </div>

                  <div className="border-t border-brand-primary/10 my-1" />

                  {/* 6. Sign Out */}
                  <button
                    type="button"
                    onClick={logout}
                    className="w-full px-4 py-2 text-xs text-rose-700 hover:bg-rose-50 font-medium flex items-center gap-2.5 text-left transition-colors cursor-pointer"
                  >
                    <i className="bi bi-box-arrow-right text-sm" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Dynamic Page Content */}
        <main className="flex-1 w-full max-w-full min-w-0 p-3 sm:p-5 md:p-6 lg:p-7 bg-app-background">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
