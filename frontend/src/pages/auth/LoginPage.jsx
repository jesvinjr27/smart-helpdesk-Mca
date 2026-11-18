import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { MicrosoftLoginButton } from '../../auth/components/MicrosoftLoginButton';
import { getRoleRedirectPath } from '../../auth/utils/roleRedirect';

export const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setLoading(true);

    try {
      const { user: userData, workspaces } = await login(email, password, null, rememberMe);
      const targetPath = getRoleRedirectPath(userData, workspaces);
      navigate(targetPath, { replace: true });
    } catch (err) {
      setErrorMessage(err.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoSelect = (demoEmail) => {
    setEmail(demoEmail);
    setPassword('Password123!');
  };

  return (
    <div className="min-h-screen min-h-[100dvh] flex flex-col lg:flex-row bg-app-background text-brand-primary font-sans">
      {/* Left Pane - Dark Blue Enterprise Branding */}
      <div className="hidden lg:flex lg:w-[45%] flex-col justify-between p-10 xl:p-12 text-white bg-brand-primary border-r border-brand-primary/30 relative overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-brand-secondary/20 blur-3xl pointer-events-none" />

        {/* Top Header */}
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-brand-secondary flex items-center justify-center text-white shadow-subtle flex-shrink-0">
              <i className="bi bi-shield-check text-2xl" />
            </div>
            <div>
              <div className="font-bold text-lg text-white tracking-tight">SmartHelpdesk</div>
              <div className="text-xs text-brand-accent">Enterprise AI Service Hub</div>
            </div>
          </div>
        </div>

        {/* Middle Feature Highlights */}
        <div className="relative z-10 my-auto py-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-white/10 text-brand-accent border border-white/20 mb-4">
            <i className="bi bi-cpu" />
            <span>AI-Driven Service Architecture</span>
          </div>

          <h2 className="text-3xl xl:text-4xl font-bold tracking-tight text-white mb-3 leading-tight">
            Intelligent Incident Management & Self-Service
          </h2>
          <p className="text-white/80 text-sm xl:text-base mb-6 max-w-lg leading-relaxed">
            Multi-tenant organization isolation, Argon2id security credentials, RAG knowledge intelligence, and automated SLA breach risk mitigation.
          </p>

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center text-brand-accent mt-0.5 flex-shrink-0">
                <i className="bi bi-shield-lock-fill text-xs" />
              </div>
              <div>
                <span className="font-semibold text-white text-sm block">Argon2id Enterprise Security</span>
                <span className="text-white/70 text-xs">RFC 9106 memory-hardened authentication with rolling refresh-token rotation.</span>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center text-brand-accent mt-0.5 flex-shrink-0">
                <i className="bi bi-building-lock text-xs" />
              </div>
              <div>
                <span className="font-semibold text-white text-sm block">Multi-Tenant Tenant Isolation</span>
                <span className="text-white/70 text-xs">Role-based workspaces for Higher Ed Colleges, Enterprises, and Global Admins.</span>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center text-brand-accent mt-0.5 flex-shrink-0">
                <i className="bi bi-clock-history text-xs" />
              </div>
              <div>
                <span className="font-semibold text-white text-sm block">Predictive SLA Breach Prevention</span>
                <span className="text-white/70 text-xs">Machine learning early-warning risk scoring for ticket queues.</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Status Pill */}
        <div className="relative z-10 flex items-center justify-between pt-4 border-t border-white/10 text-xs text-white/70">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-brand-accent inline-block animate-pulse" />
            <span>FastAPI & MySQL Services Online</span>
          </div>
          <span>v2.5 Security Release</span>
        </div>
      </div>

      {/* Right Pane - Cream Background Auth Form */}
      <div className="flex-1 flex flex-col justify-center items-center p-4 sm:p-8 md:p-12 relative min-w-0 bg-app-background">
        <div className="w-full max-w-md card-glow p-6 sm:p-8 rounded-2xl">
          {/* Mobile Logo Branding */}
          <div className="lg:hidden text-center mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-brand-primary text-white shadow-subtle mb-2">
              <i className="bi bi-shield-check text-2xl" />
            </div>
            <h2 className="text-xl font-bold tracking-tight text-brand-primary">
              SmartHelpdesk
            </h2>
            <p className="text-xs text-brand-secondary">Enterprise AI Help Desk</p>
          </div>

          <div className="mb-6">
            <h1 className="text-2xl font-bold tracking-tight text-brand-primary">
              Sign in to your account
            </h1>
            <p className="text-sm text-brand-secondary mt-1">
              Enter your credentials or choose a quick demo account below.
            </p>
          </div>

          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-brand-primary/10 border border-brand-primary/30 flex items-start gap-2.5 text-xs text-brand-primary mb-5">
              <i className="bi bi-exclamation-triangle-fill text-brand-primary text-base flex-shrink-0 mt-0.5" />
              <div className="flex-1 leading-relaxed">{errorMessage}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-brand-primary mb-1.5">
                Email Address
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-3.5 text-brand-secondary text-sm pointer-events-none">
                  <i className="bi bi-envelope" />
                </span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@organization.com"
                  className="w-full pl-10 pr-3.5 py-2.5 text-sm input-glow rounded-xl text-brand-primary placeholder:text-brand-secondary/60 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-brand-primary">
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs font-medium text-brand-secondary hover:text-brand-primary transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative flex items-center">
                <span className="absolute left-3.5 text-brand-secondary text-sm pointer-events-none">
                  <i className="bi bi-lock" />
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 text-sm input-glow rounded-xl text-brand-primary placeholder:text-brand-secondary/60 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 text-brand-secondary hover:text-brand-primary transition-colors text-sm"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`} />
                </button>
              </div>
            </div>

            {/* Remember Me Option */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-brand-primary/30 text-brand-primary focus:ring-brand-accent/50 cursor-pointer accent-brand-primary"
                />
                <span className="text-xs font-medium text-brand-primary">Remember this device</span>
              </label>
              <span className="text-[11px] text-brand-secondary">Secure 30-day session</span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-brand-primary hover:bg-brand-primary/90 text-white font-semibold text-sm rounded-xl shadow-subtle transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <i className="bi bi-arrow-right" />
                </>
              )}
            </button>
          </form>

          {/* OR Divider */}
          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-brand-primary/15" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-app-background px-3 text-brand-secondary font-semibold tracking-wider">
                OR
              </span>
            </div>
          </div>

          {/* Microsoft SSO Button */}
          <div className="mb-6">
            <MicrosoftLoginButton />
          </div>

          {/* Quick Demo Credentials Showcase */}
          <div className="pt-4 border-t border-brand-primary/15">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-brand-primary">
                Quick Demo Accounts (Password: Password123!)
              </span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-brand-secondary/15 text-brand-primary">
                Click to Auto-fill
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleDemoSelect('admin@apex.com')}
                className="p-2 rounded-xl border border-brand-primary/15 hover:border-brand-primary/40 bg-app-background hover:bg-brand-accent/15 transition-all flex items-center gap-2.5 text-left group"
              >
                <div className="w-6 h-6 rounded-lg bg-brand-secondary/15 text-brand-primary flex items-center justify-center text-xs flex-shrink-0 group-hover:bg-brand-primary group-hover:text-white transition-colors">
                  <i className="bi bi-shield-lock" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-semibold text-brand-primary truncate">
                    Org Admin
                  </div>
                  <div className="text-[10px] text-brand-secondary truncate">admin@apex.com</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleDemoSelect('agent.john@apex.com')}
                className="p-2 rounded-xl border border-brand-primary/15 hover:border-brand-primary/40 bg-app-background hover:bg-brand-accent/15 transition-all flex items-center gap-2.5 text-left group"
              >
                <div className="w-6 h-6 rounded-lg bg-brand-secondary/15 text-brand-primary flex items-center justify-center text-xs flex-shrink-0 group-hover:bg-brand-primary group-hover:text-white transition-colors">
                  <i className="bi bi-headset" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-semibold text-brand-primary truncate">
                    Support Agent
                  </div>
                  <div className="text-[10px] text-brand-secondary truncate">agent.john@apex.com</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleDemoSelect('lead.it@apex.com')}
                className="p-2 rounded-xl border border-brand-primary/15 hover:border-brand-primary/40 bg-app-background hover:bg-brand-accent/15 transition-all flex items-center gap-2.5 text-left group"
              >
                <div className="w-6 h-6 rounded-lg bg-brand-secondary/15 text-brand-primary flex items-center justify-center text-xs flex-shrink-0 group-hover:bg-brand-primary group-hover:text-white transition-colors">
                  <i className="bi bi-diagram-3" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-semibold text-brand-primary truncate">
                    Team Lead
                  </div>
                  <div className="text-[10px] text-brand-secondary truncate">lead.it@apex.com</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleDemoSelect('user.alice@apex.com')}
                className="p-2 rounded-xl border border-brand-primary/15 hover:border-brand-primary/40 bg-app-background hover:bg-brand-accent/15 transition-all flex items-center gap-2.5 text-left group"
              >
                <div className="w-6 h-6 rounded-lg bg-brand-secondary/15 text-brand-primary flex items-center justify-center text-xs flex-shrink-0 group-hover:bg-brand-primary group-hover:text-white transition-colors">
                  <i className="bi bi-person" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-semibold text-brand-primary truncate">
                    Employee
                  </div>
                  <div className="text-[10px] text-brand-secondary truncate">user.alice@apex.com</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleDemoSelect('student.emma@greenwood.edu')}
                className="p-2 rounded-xl border border-brand-primary/15 hover:border-brand-primary/40 bg-app-background hover:bg-brand-accent/15 transition-all flex items-center gap-2.5 text-left group"
              >
                <div className="w-6 h-6 rounded-lg bg-brand-secondary/15 text-brand-primary flex items-center justify-center text-xs flex-shrink-0 group-hover:bg-brand-primary group-hover:text-white transition-colors">
                  <i className="bi bi-mortarboard" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-semibold text-brand-primary truncate">
                    Student
                  </div>
                  <div className="text-[10px] text-brand-secondary truncate">student.emma</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleDemoSelect('sysadmin@smarthelpdesk.local')}
                className="p-2 rounded-xl border border-brand-primary/25 hover:border-brand-primary/50 bg-brand-secondary/10 hover:bg-brand-accent/20 transition-all flex items-center gap-2.5 text-left group"
              >
                <div className="w-6 h-6 rounded-lg bg-brand-primary text-white flex items-center justify-center text-xs flex-shrink-0">
                  <i className="bi bi-gear-wide-connected" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-semibold text-brand-primary truncate">
                    Global SysAdmin
                  </div>
                  <div className="text-[10px] text-brand-secondary truncate">sysadmin@local</div>
                </div>
              </button>
            </div>
          </div>

          {/* Footer Copyright */}
          <div className="mt-5 pt-4 border-t border-brand-primary/10 text-center text-[11px] text-brand-secondary">
            © 2026 Smart Help Desk System. All rights reserved.
          </div>
        </div>
      </div>
    </div>
  );
};
