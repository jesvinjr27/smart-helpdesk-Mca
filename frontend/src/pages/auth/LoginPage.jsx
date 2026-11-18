import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../context/ToastContext';
import { MicrosoftLoginButton } from '../../auth/components/MicrosoftLoginButton';
import { getRoleRedirectPath } from '../../auth/utils/roleRedirect';
import { validateEmail, validatePassword } from '../../auth/utils/validation';

export const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);

  const [errors, setErrors] = useState({ email: '', password: '' });
  const [touched, setTouched] = useState({ email: false, password: false });

  const { login } = useAuth();
  const { showError } = useToast();
  const navigate = useNavigate();

  const handleEmailChange = (e) => {
    const val = e.target.value;
    setEmail(val);
    if (touched.email || errors.email) {
      const res = validateEmail(val);
      setErrors((prev) => ({ ...prev, email: res.error }));
    }
  };

  const handlePasswordChange = (e) => {
    const val = e.target.value;
    setPassword(val);
    if (touched.password || errors.password) {
      const res = validatePassword(val);
      setErrors((prev) => ({ ...prev, password: res.error }));
    }
  };

  const handleEmailBlur = () => {
    setTouched((prev) => ({ ...prev, email: true }));
    const res = validateEmail(email);
    setErrors((prev) => ({ ...prev, email: res.error }));
  };

  const handlePasswordBlur = () => {
    setTouched((prev) => ({ ...prev, password: true }));
    const res = validatePassword(password);
    setErrors((prev) => ({ ...prev, password: res.error }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Prevent duplicate API calls while request is actively in-flight
    if (loading) return;

    // Validate all fields
    setTouched({ email: true, password: true });
    const emailRes = validateEmail(email);
    const passRes = validatePassword(password);

    const newErrors = {
      email: emailRes.error,
      password: passRes.error,
    };
    setErrors(newErrors);

    if (!emailRes.isValid || !passRes.isValid) {
      // Trigger ONE meaningful notification for the failed submission
      const firstError = emailRes.error || passRes.error;
      showError(firstError);
      return;
    }

    setLoading(true);

    try {
      const { user: userData, workspaces } = await login(
        emailRes.value,
        password,
        null,
        rememberMe
      );
      const targetPath = getRoleRedirectPath(userData, workspaces);
      navigate(targetPath, { replace: true });
    } catch (err) {
      let msg = err.message || 'Invalid email or password.';
      if (
        msg.toLowerCase().includes('credentials') ||
        msg.toLowerCase().includes('incorrect') ||
        msg.toLowerCase().includes('invalid email')
      ) {
        msg = 'Invalid email or password.';
        setErrors({ email: 'Invalid email or password', password: 'Invalid email or password' });
      }
      showError(msg);
    } finally {
      setLoading(false);
    }
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
              Enter your email and password to access your help desk workspace.
            </p>
          </div>

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            {/* Email Field */}
            <div>
              <label
                htmlFor="email-input"
                className="block text-xs font-semibold uppercase tracking-wider text-brand-primary mb-1.5"
              >
                Email Address
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-3.5 text-brand-secondary text-sm pointer-events-none">
                  <i className="bi bi-envelope" />
                </span>
                <input
                  id="email-input"
                  type="email"
                  value={email}
                  onChange={handleEmailChange}
                  onBlur={handleEmailBlur}
                  placeholder="name@organization.com"
                  aria-invalid={errors.email && touched.email ? 'true' : 'false'}
                  aria-describedby={errors.email && touched.email ? 'email-error' : undefined}
                  className={`w-full pl-10 pr-3.5 py-2.5 text-sm rounded-xl text-brand-primary placeholder:text-brand-secondary/60 focus:outline-none transition-all ${
                    errors.email && touched.email ? 'input-error' : 'input-glow'
                  }`}
                />
              </div>
              {errors.email && touched.email && (
                <p
                  id="email-error"
                  role="alert"
                  className="text-xs text-[#DC2626] mt-1.5 flex items-center gap-1.5 font-medium animate-fadeIn"
                >
                  <i className="bi bi-exclamation-circle-fill text-xs flex-shrink-0" />
                  <span>{errors.email}</span>
                </p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="password-input"
                  className="text-xs font-semibold uppercase tracking-wider text-brand-primary"
                >
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
                  id="password-input"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={handlePasswordChange}
                  onBlur={handlePasswordBlur}
                  placeholder="••••••••"
                  aria-invalid={errors.password && touched.password ? 'true' : 'false'}
                  aria-describedby={errors.password && touched.password ? 'password-error' : undefined}
                  className={`w-full pl-10 pr-10 py-2.5 text-sm rounded-xl text-brand-primary placeholder:text-brand-secondary/60 focus:outline-none transition-all ${
                    errors.password && touched.password ? 'input-error' : 'input-glow'
                  }`}
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
              {errors.password && touched.password && (
                <p
                  id="password-error"
                  role="alert"
                  className="text-xs text-[#DC2626] mt-1.5 flex items-center gap-1.5 font-medium animate-fadeIn"
                >
                  <i className="bi bi-exclamation-circle-fill text-xs flex-shrink-0" />
                  <span>{errors.password}</span>
                </p>
              )}
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

            {/* Submit Button */}
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
          <div className="mb-2">
            <MicrosoftLoginButton />
          </div>

          {/* Footer Copyright */}
          <div className="mt-8 pt-4 border-t border-brand-primary/10 text-center text-[11px] text-brand-secondary">
            © 2026 Smart Help Desk System. All rights reserved.
          </div>
        </div>
      </div>
    </div>
  );
};
