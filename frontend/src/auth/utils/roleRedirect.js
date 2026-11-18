/**
 * Deterministic role-based workspace and dashboard redirect resolver.
 * Handles the 6 application roles:
 * 1. Global Admin (SYS_ADMIN)
 * 2. Organization Admin (ORG_ADMIN)
 * 3. Team Lead (LEAD)
 * 4. Support Agent (AGENT)
 * 5. Student (REQUESTER from educational org)
 * 6. Employee (REQUESTER from enterprise org)
 */

export const getRoleRedirectPath = (user, workspaces = []) => {
  if (!user) return '/login';

  // If user has multiple authorized workspaces and no workspace is active yet
  const availableWorkspaces = workspaces?.length ? workspaces : (user.workspaces || []);
  const activeWorkspace = localStorage.getItem('active_workspace_id');

  if (availableWorkspaces.length > 1 && !activeWorkspace) {
    return '/select-workspace';
  }

  const roles = user.roles || [];

  if (roles.includes('SYS_ADMIN')) {
    return '/global-admin/dashboard';
  }

  if (roles.includes('ORG_ADMIN')) {
    return '/org-admin/dashboard';
  }

  if (roles.includes('LEAD')) {
    return '/team-lead/dashboard';
  }

  if (roles.includes('AGENT')) {
    return '/agent/dashboard';
  }

  if (roles.includes('REQUESTER')) {
    const email = (user.email || '').toLowerCase();
    const orgName = (user.org_name || '').toLowerCase();
    
    // Differentiate Student vs Employee
    if (
      email.includes('student') ||
      email.endsWith('.edu') ||
      orgName.includes('institute') ||
      orgName.includes('university') ||
      orgName.includes('college')
    ) {
      return '/student/dashboard';
    }
    return '/employee/dashboard';
  }

  return '/dashboard';
};
