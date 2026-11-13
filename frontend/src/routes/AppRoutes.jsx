import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { AppLayout } from '../layouts/AppLayout';

import { LoginPage } from '../pages/auth/LoginPage';
import { DashboardPage } from '../pages/dashboard/DashboardPage';
import { TicketListPage } from '../pages/tickets/TicketListPage';
import { TicketCreatePage } from '../pages/tickets/TicketCreatePage';
import { TicketDetailPage } from '../pages/tickets/TicketDetailPage';
import { KnowledgeBasePage } from '../pages/knowledge-base/KnowledgeBasePage';
import { AIAssistantPage } from '../pages/ai-assistant/AIAssistantPage';
import { SLAManagementPage } from '../pages/sla/SLAManagementPage';
import { AdminUsersPage } from '../pages/administration/AdminUsersPage';
import { AIModelMonitorPage } from '../pages/administration/AIModelMonitorPage';
import { AuditLogsPage } from '../pages/administration/AuditLogsPage';

// Protected Route Guard
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// Role Guard
const RoleRoute = ({ allowedRoles, children }) => {
  const { hasRole, loading } = useAuth();

  if (loading) return null;

  if (!hasRole(allowedRoles)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        
        {/* Tickets */}
        <Route path="tickets" element={<TicketListPage />} />
        <Route path="tickets/new" element={<TicketCreatePage />} />
        <Route path="tickets/:id" element={<TicketDetailPage />} />

        {/* Knowledge & AI */}
        <Route path="knowledge-base" element={<KnowledgeBasePage />} />
        <Route path="ai-assistant" element={<AIAssistantPage />} />
        
        <Route
          path="sla"
          element={
            <RoleRoute allowedRoles={['AGENT', 'LEAD', 'ORG_ADMIN', 'SYS_ADMIN']}>
              <SLAManagementPage />
            </RoleRoute>
          }
        />

        {/* Administration */}
        <Route
          path="admin/users"
          element={
            <RoleRoute allowedRoles={['ORG_ADMIN', 'SYS_ADMIN']}>
              <AdminUsersPage />
            </RoleRoute>
          }
        />
        <Route
          path="admin/ai-models"
          element={
            <RoleRoute allowedRoles={['LEAD', 'ORG_ADMIN', 'SYS_ADMIN']}>
              <AIModelMonitorPage />
            </RoleRoute>
          }
        />
        <Route
          path="admin/audit-logs"
          element={
            <RoleRoute allowedRoles={['ORG_ADMIN', 'SYS_ADMIN']}>
              <AuditLogsPage />
            </RoleRoute>
          }
        />
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};
