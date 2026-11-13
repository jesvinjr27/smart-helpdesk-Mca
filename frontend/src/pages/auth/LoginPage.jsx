import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

export const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setErrorMessage(err.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoSelect = (demoEmail) => {
    setEmail(demoEmail);
    setPassword('Password123!');
  };

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light py-5">
      <div className="container" style={{ maxWidth: '480px' }}>
        <div className="card shadow-sm border-0 rounded-4 overflow-hidden">
          <div className="card-header bg-dark text-white p-4 text-center border-0">
            <div
              className="bg-primary text-white mx-auto rounded-circle d-flex align-items-center justify-content-center mb-3"
              style={{ width: '56px', height: '56px' }}
            >
              <i className="bi bi-shield-check fs-2"></i>
            </div>
            <h4 className="fw-bold mb-1">SmartHelpdesk</h4>
            <p className="text-secondary small mb-0">
              AI-Powered Enterprise Help Desk & Ticket Management
            </p>
          </div>

          <div className="card-body p-4">
            {errorMessage && (
              <div className="alert alert-danger d-flex align-items-center py-2 px-3 small rounded-3 mb-3">
                <i className="bi bi-exclamation-triangle-fill me-2 fs-5"></i>
                <div>{errorMessage}</div>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label small fw-semibold">Work / Student Email</label>
                <div className="input-group">
                  <span className="input-group-text bg-light border-end-0">
                    <i className="bi bi-envelope text-muted"></i>
                  </span>
                  <input
                    type="email"
                    required
                    className="form-control border-start-0"
                    placeholder="user@apex.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="form-label small fw-semibold">Password</label>
                <div className="input-group">
                  <span className="input-group-text bg-light border-end-0">
                    <i className="bi bi-lock text-muted"></i>
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    className="form-control border-start-0 border-end-0"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    className="input-group-text bg-light border-start-0 text-muted"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary w-100 py-2 fw-semibold rounded-3 shadow-sm d-flex align-items-center justify-content-center gap-2"
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm" role="status"></span>
                    <span>Authenticating...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In</span>
                    <i className="bi bi-arrow-right"></i>
                  </>
                )}
              </button>
            </form>

            {/* Quick Demo Credentials */}
            <div className="mt-4 pt-3 border-top">
              <div className="d-flex align-items-center justify-content-between mb-2">
                <span className="text-xs fw-bold text-uppercase text-muted">
                  Quick Demo Accounts
                </span>
                <span className="badge bg-secondary-subtle text-secondary text-xs">
                  Password: Password123!
                </span>
              </div>
              <div className="d-flex flex-wrap gap-1">
                <button
                  type="button"
                  onClick={() => handleDemoSelect('admin@apex.com')}
                  className="btn btn-outline-secondary btn-sm text-xs py-1 px-2"
                >
                  <i className="bi bi-shield-lock me-1"></i>Org Admin (Apex)
                </button>
                <button
                  type="button"
                  onClick={() => handleDemoSelect('agent.john@apex.com')}
                  className="btn btn-outline-secondary btn-sm text-xs py-1 px-2"
                >
                  <i className="bi bi-headset me-1"></i>Support Agent
                </button>
                <button
                  type="button"
                  onClick={() => handleDemoSelect('lead.it@apex.com')}
                  className="btn btn-outline-secondary btn-sm text-xs py-1 px-2"
                >
                  <i className="bi bi-diagram-3 me-1"></i>Team Lead
                </button>
                <button
                  type="button"
                  onClick={() => handleDemoSelect('user.alice@apex.com')}
                  className="btn btn-outline-secondary btn-sm text-xs py-1 px-2"
                >
                  <i className="bi bi-person me-1"></i>Employee (Alice)
                </button>
                <button
                  type="button"
                  onClick={() => handleDemoSelect('student.emma@greenwood.edu')}
                  className="btn btn-outline-secondary btn-sm text-xs py-1 px-2"
                >
                  <i className="bi bi-mortarboard me-1"></i>College Student
                </button>
                <button
                  type="button"
                  onClick={() => handleDemoSelect('sysadmin@smarthelpdesk.local')}
                  className="btn btn-outline-danger btn-sm text-xs py-1 px-2"
                >
                  <i className="bi bi-gear-wide-connected me-1"></i>Global SysAdmin
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
