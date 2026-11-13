import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';

export const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const { login } = useAuth();
  const { theme, toggleTheme } = useTheme();
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
    <div className="min-vh-100 d-flex flex-column flex-lg-row bg-app" style={{ backgroundColor: 'var(--bg-app)' }}>
      {/* Left Pane - Premium SaaS Branding & Value Propositions */}
      <div
        className="d-none d-lg-flex flex-column justify-content-between p-5 text-white"
        style={{
          width: '45%',
          background: 'radial-gradient(ellipse at top left, #1e3a8a 0%, #0b0f19 70%)',
          borderRight: '1px solid var(--sidebar-border)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Ambient background glow orb */}
        <div
          style={{
            position: 'absolute',
            width: '400px',
            height: '400px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(59, 130, 246, 0.25) 0%, rgba(0, 0, 0, 0) 70%)',
            top: '-50px',
            left: '-50px',
            pointerEvents: 'none',
          }}
        />

        {/* Top Header */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div className="d-flex align-items-center gap-3 mb-4">
            <div
              className="d-flex align-items-center justify-content-center rounded-3 shadow-lg"
              style={{
                width: '44px',
                height: '44px',
                background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)',
              }}
            >
              <i className="bi bi-shield-check fs-4 text-white"></i>
            </div>
            <div>
              <div className="fw-bold fs-5 text-white tracking-tight">SmartHelpdesk</div>
              <div className="text-xs text-white-50">Enterprise AI Service Hub</div>
            </div>
          </div>
        </div>

        {/* Middle Feature Highlights */}
        <div style={{ position: 'relative', zIndex: 1 }} className="my-auto py-4">
          <div className="badge bg-primary bg-opacity-25 text-primary-subtle border border-primary border-opacity-25 px-3 py-1.5 rounded-pill mb-3">
            <i className="bi bi-cpu me-1.5"></i>Next-Gen Help Desk AI
          </div>
          <h2 className="fw-bold display-6 mb-3 text-white" style={{ letterSpacing: '-0.02em', lineHeight: 1.2 }}>
            Intelligent Incident Management & Self-Service
          </h2>
          <p className="text-white-50 mb-4 fs-6" style={{ maxWidth: '440px', lineHeight: 1.6 }}>
            Powered by local fine-tuned classification, FAISS vector retrieval, and automated SLA breach risk mitigation.
          </p>

          <div className="d-flex flex-column gap-3 mb-4">
            <div className="d-flex align-items-start gap-3">
              <div
                className="rounded-circle d-flex align-items-center justify-content-center text-primary mt-1"
                style={{ width: '28px', height: '28px', background: 'rgba(59, 130, 246, 0.15)', flexShrink: 0 }}
              >
                <i className="bi bi-shield-lock-fill"></i>
              </div>
              <div>
                <span className="fw-semibold text-white text-sm d-block">Zero Cloud Data Leakage</span>
                <span className="text-white-50 text-xs">All inferences run strictly on organization-controlled infrastructure.</span>
              </div>
            </div>

            <div className="d-flex align-items-start gap-3">
              <div
                className="rounded-circle d-flex align-items-center justify-content-center text-info mt-1"
                style={{ width: '28px', height: '28px', background: 'rgba(6, 182, 212, 0.15)', flexShrink: 0 }}
              >
                <i className="bi bi-search"></i>
              </div>
              <div>
                <span className="fw-semibold text-white text-sm d-block">RAG-Grounded Verified Answers</span>
                <span className="text-white-50 text-xs">Direct citations from approved organization knowledge base guides.</span>
              </div>
            </div>

            <div className="d-flex align-items-start gap-3">
              <div
                className="rounded-circle d-flex align-items-center justify-content-center text-warning mt-1"
                style={{ width: '28px', height: '28px', background: 'rgba(245, 158, 11, 0.15)', flexShrink: 0 }}
              >
                <i className="bi bi-clock-history"></i>
              </div>
              <div>
                <span className="fw-semibold text-white text-sm d-block">Predictive SLA Breach Prevention</span>
                <span className="text-white-50 text-xs">Machine learning early-warning alerts for queue congestion and escalations.</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Status Pill */}
        <div style={{ position: 'relative', zIndex: 1 }} className="d-flex align-items-center justify-content-between pt-3 border-top border-secondary border-opacity-25 text-xs text-white-50">
          <div className="d-flex align-items-center gap-2">
            <span className="badge-dot bg-success" style={{ width: '8px', height: '8px' }}></span>
            <span>All System Services Operational</span>
          </div>
          <span>v2.4 Enterprise Edition</span>
        </div>
      </div>

      {/* Right Pane - Modern Authentication Card */}
      <div className="flex-grow-1 d-flex flex-column justify-content-center align-items-center p-4 p-sm-5">
        <div className="w-100 position-absolute top-0 end-0 p-4 d-flex justify-content-end">
          <button
            type="button"
            onClick={toggleTheme}
            className="btn btn-sm btn-outline-secondary border-default rounded-circle p-2 text-secondary"
            style={{ width: '38px', height: '38px' }}
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
          >
            <i className={`bi ${theme === 'dark' ? 'bi-sun-fill text-warning' : 'bi-moon-stars text-secondary'} fs-6`}></i>
          </button>
        </div>

        <div className="w-100" style={{ maxWidth: '440px' }}>
          {/* Mobile Logo Branding */}
          <div className="d-lg-none text-center mb-4">
            <div
              className="d-inline-flex align-items-center justify-content-center rounded-3 mb-2 shadow-sm"
              style={{
                width: '48px',
                height: '48px',
                background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)',
              }}
            >
              <i className="bi bi-shield-check fs-3 text-white"></i>
            </div>
            <h4 className="fw-bold mb-0 text-primary-emphasis">SmartHelpdesk</h4>
            <p className="text-muted text-xs">AI-Powered Enterprise Help Desk</p>
          </div>

          <div className="mb-4">
            <h3 className="fw-bold tracking-tight text-primary-emphasis mb-1">Sign in to your account</h3>
            <p className="text-muted text-sm mb-0">Enter your credentials or choose a quick demo account below.</p>
          </div>

          {errorMessage && (
            <div className="alert alert-danger d-flex align-items-center py-2.5 px-3 rounded-3 mb-4 text-sm" role="alert">
              <i className="bi bi-exclamation-triangle-fill me-2 fs-5 text-danger flex-shrink-0"></i>
              <div>{errorMessage}</div>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label">Email Address</label>
              <div className="input-group">
                <span className="input-group-text bg-surface-subtle border-default border-end-0 text-muted">
                  <i className="bi bi-envelope"></i>
                </span>
                <input
                  type="email"
                  required
                  className="form-control border-start-0"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="mb-4">
              <div className="d-flex justify-content-between align-items-center mb-1">
                <label className="form-label mb-0">Password</label>
                <span className="text-xs text-muted">Default: Password123!</span>
              </div>
              <div className="input-group">
                <span className="input-group-text bg-surface-subtle border-default border-end-0 text-muted">
                  <i className="bi bi-lock"></i>
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
                  className="input-group-text bg-surface-subtle border-default border-start-0 text-muted"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-100 py-2.5 fw-semibold shadow-sm rounded-3"
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <i className="bi bi-arrow-right ms-1"></i>
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Credentials Showcase */}
          <div className="mt-4 pt-3 border-top border-subtle">
            <div className="d-flex align-items-center justify-content-between mb-2.5">
              <span className="text-xs fw-bold text-uppercase text-muted letter-spacing-wide">
                Quick Demo Accounts
              </span>
              <span className="badge bg-secondary-subtle text-secondary text-xs">
                Click to Auto-fill
              </span>
            </div>

            <div className="d-grid gap-1.5" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
              <button
                type="button"
                onClick={() => handleDemoSelect('admin@apex.com')}
                className="btn btn-outline-secondary btn-sm text-start py-2 px-2.5 rounded-3 d-flex align-items-center gap-2"
                style={{ fontSize: '0.75rem' }}
              >
                <i className="bi bi-shield-lock text-primary fs-6"></i>
                <div className="overflow-hidden text-truncate">
                  <div className="fw-semibold text-truncate">Org Admin</div>
                  <div className="text-muted text-xs text-truncate">admin@apex.com</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleDemoSelect('agent.john@apex.com')}
                className="btn btn-outline-secondary btn-sm text-start py-2 px-2.5 rounded-3 d-flex align-items-center gap-2"
                style={{ fontSize: '0.75rem' }}
              >
                <i className="bi bi-headset text-info fs-6"></i>
                <div className="overflow-hidden text-truncate">
                  <div className="fw-semibold text-truncate">Support Agent</div>
                  <div className="text-muted text-xs text-truncate">agent.john@apex.com</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleDemoSelect('lead.it@apex.com')}
                className="btn btn-outline-secondary btn-sm text-start py-2 px-2.5 rounded-3 d-flex align-items-center gap-2"
                style={{ fontSize: '0.75rem' }}
              >
                <i className="bi bi-diagram-3 text-warning fs-6"></i>
                <div className="overflow-hidden text-truncate">
                  <div className="fw-semibold text-truncate">Team Lead</div>
                  <div className="text-muted text-xs text-truncate">lead.it@apex.com</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleDemoSelect('user.alice@apex.com')}
                className="btn btn-outline-secondary btn-sm text-start py-2 px-2.5 rounded-3 d-flex align-items-center gap-2"
                style={{ fontSize: '0.75rem' }}
              >
                <i className="bi bi-person text-success fs-6"></i>
                <div className="overflow-hidden text-truncate">
                  <div className="fw-semibold text-truncate">Employee User</div>
                  <div className="text-muted text-xs text-truncate">user.alice@apex.com</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleDemoSelect('student.emma@greenwood.edu')}
                className="btn btn-outline-secondary btn-sm text-start py-2 px-2.5 rounded-3 d-flex align-items-center gap-2"
                style={{ fontSize: '0.75rem' }}
              >
                <i className="bi bi-mortarboard text-secondary fs-6"></i>
                <div className="overflow-hidden text-truncate">
                  <div className="fw-semibold text-truncate">College Student</div>
                  <div className="text-muted text-xs text-truncate">student.emma</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleDemoSelect('sysadmin@smarthelpdesk.local')}
                className="btn btn-outline-secondary btn-sm text-start py-2 px-2.5 rounded-3 d-flex align-items-center gap-2 border-danger-subtle"
                style={{ fontSize: '0.75rem' }}
              >
                <i className="bi bi-gear-wide-connected text-danger fs-6"></i>
                <div className="overflow-hidden text-truncate">
                  <div className="fw-semibold text-truncate text-danger">Global SysAdmin</div>
                  <div className="text-muted text-xs text-truncate">sysadmin@local</div>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
