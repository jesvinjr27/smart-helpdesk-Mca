import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { getRoleRedirectPath } from '../../auth/utils/roleRedirect';

export const SelectWorkspacePage = () => {
  const { user, workspaces, setActiveWorkspace } = useAuth();
  const navigate = useNavigate();

  const userWorkspaces = workspaces?.length ? workspaces : (user?.workspaces || []);

  const handleSelectWorkspace = (ws) => {
    localStorage.setItem('active_workspace_id', ws.organization_id);
    localStorage.setItem('active_workspace_name', ws.organization_name);
    if (setActiveWorkspace) {
      setActiveWorkspace(ws);
    }
    const targetPath = getRoleRedirectPath(user, [ws]);
    navigate(targetPath, { replace: true });
  };

  return (
    <div className="min-h-screen min-h-[100dvh] flex flex-col justify-center items-center p-4 sm:p-6 bg-app-background font-sans text-brand-primary">
      <div className="w-full max-w-lg card-glow p-6 sm:p-8 rounded-2xl relative">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-brand-primary text-white shadow-subtle mb-3">
            <i className="bi bi-building text-2xl" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-brand-primary">
            Select Workspace
          </h1>
          <p className="text-sm text-brand-secondary mt-1">
            Your account ({user?.email}) has access to multiple organizations. Please choose a workspace to continue.
          </p>
        </div>

        <div className="space-y-3">
          {userWorkspaces.map((ws) => (
            <button
              key={ws.organization_id}
              onClick={() => handleSelectWorkspace(ws)}
              className="w-full p-4 rounded-xl border border-brand-primary/20 hover:border-brand-primary/60 bg-app-background hover:bg-brand-accent/20 transition-all flex items-center justify-between group text-left"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-brand-primary/10 text-brand-primary flex items-center justify-center group-hover:bg-brand-primary group-hover:text-white transition-colors flex-shrink-0">
                  <i className="bi bi-diagram-3 text-lg" />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-bold text-brand-primary truncate group-hover:text-brand-primary">
                    {ws.organization_name}
                  </div>
                  <div className="text-xs text-brand-secondary flex items-center gap-2 mt-0.5">
                    <span className="font-mono text-[11px] bg-brand-primary/10 px-1.5 py-0.2 rounded">
                      {ws.organization_code}
                    </span>
                    <span>•</span>
                    <span>Role: {ws.role}</span>
                  </div>
                </div>
              </div>
              <div className="w-7 h-7 rounded-lg bg-brand-primary/10 group-hover:bg-brand-primary group-hover:text-white flex items-center justify-center text-xs text-brand-primary transition-colors flex-shrink-0 ml-2">
                <i className="bi bi-chevron-right" />
              </div>
            </button>
          ))}
        </div>

        <div className="mt-6 pt-5 border-t border-brand-primary/15 text-center">
          <button
            type="button"
            onClick={() => {
              localStorage.clear();
              window.location.href = '/login';
            }}
            className="text-xs font-semibold text-brand-secondary hover:text-brand-primary transition-colors inline-flex items-center gap-1.5"
          >
            <i className="bi bi-box-arrow-left" />
            <span>Sign out and use another account</span>
          </button>
        </div>
      </div>
    </div>
  );
};
