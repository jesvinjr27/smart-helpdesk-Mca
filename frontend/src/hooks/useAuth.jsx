import React, { createContext, useContext, useState, useEffect } from 'react';
import { loginApi, logoutApi, getMeApi } from '../api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [workspaces, setWorkspaces] = useState([]);
  const [activeWorkspace, setActiveWorkspaceState] = useState(() => {
    const savedId = localStorage.getItem('active_workspace_id');
    const savedName = localStorage.getItem('active_workspace_name');
    return savedId ? { organization_id: savedId, organization_name: savedName } : null;
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('access_token');
      if (token) {
        try {
          const resp = await getMeApi();
          setUser(resp.data);
          if (resp.data?.workspaces) {
            setWorkspaces(resp.data.workspaces);
          }
        } catch (err) {
          console.error('Session expired or invalid:', err);
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          setUser(null);
          setWorkspaces([]);
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email, password, orgId = null, rememberMe = false) => {
    setError(null);
    try {
      const resp = await loginApi({
        email,
        password,
        org_id: orgId,
        remember_me: rememberMe,
      });
      const { access_token, refresh_token, user: userData, workspaces: wsList } = resp.data;

      localStorage.setItem('access_token', access_token);
      localStorage.setItem('refresh_token', refresh_token);
      if (rememberMe) {
        localStorage.setItem('auth_remember_me', 'true');
      } else {
        localStorage.removeItem('auth_remember_me');
      }

      setUser(userData);
      const availableWs = wsList || userData.workspaces || [];
      setWorkspaces(availableWs);

      return { user: userData, workspaces: availableWs };
    } catch (err) {
      let msg = 'Login failed. Please check credentials.';
      const detail = err.response?.data?.detail;
      if (typeof detail === 'string') {
        msg = detail;
      } else if (Array.isArray(detail)) {
        msg = detail.map((d) => d.msg || JSON.stringify(d)).join(', ');
      } else if (detail && typeof detail === 'object') {
        msg = detail.msg || detail.message || JSON.stringify(detail);
      } else if (err.message) {
        msg = err.message;
      }
      setError(msg);
      throw new Error(msg);
    }
  };

  const setActiveWorkspace = (workspace) => {
    if (workspace) {
      localStorage.setItem('active_workspace_id', workspace.organization_id);
      localStorage.setItem('active_workspace_name', workspace.organization_name);
      setActiveWorkspaceState(workspace);
    } else {
      localStorage.removeItem('active_workspace_id');
      localStorage.removeItem('active_workspace_name');
      setActiveWorkspaceState(null);
    }
  };

  const logout = async () => {
    try {
      await logoutApi();
    } catch (e) {
      // Ignore network errors on logout
    } finally {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('active_workspace_id');
      localStorage.removeItem('active_workspace_name');
      setUser(null);
      setWorkspaces([]);
      setActiveWorkspaceState(null);
      window.location.href = '/login';
    }
  };

  const hasRole = (allowedRoles) => {
    if (!user || !user.roles) return false;
    if (user.roles.includes('SYS_ADMIN')) return true;
    return allowedRoles.some((r) => user.roles.includes(r));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        workspaces,
        activeWorkspace,
        setActiveWorkspace,
        loading,
        error,
        login,
        logout,
        hasRole,
        setUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
