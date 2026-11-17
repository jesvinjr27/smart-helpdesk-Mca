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
    <div className="min-h-screen min-h-[100dvh] flex flex-col lg:flex-row bg-slate-50 dark:bg-[#090d16] text-slate-900 dark:text-slate-100 font-sans">
      {/* Left Pane - Premium SaaS Branding & Value Propositions */}
      <div className="hidden lg:flex lg:w-[45%] flex-col justify-between p-10 xl:p-12 text-white bg-gradient-to-br from-blue-950 via-slate-950 to-slate-900 border-r border-slate-800 relative overflow-hidden">
        {/* Ambient background glow orb */}
        <div className="absolute -top-20 -left-20 w-96 h-96 rounded-full bg-blue-600/20 blur-3xl pointer-events-none" />

        {/* Top Header */}
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20 flex-shrink-0">
              <i className="bi bi-shield-check text-2xl" />
            </div>
            <div>
              <div className="font-bold text-lg text-white tracking-tight">SmartHelpdesk</div>
              <div className="text-xs text-slate-400">Enterprise AI Service Hub</div>
            </div>
          </div>
        </div>

        {/* Middle Feature Highlights */}
        <div className="relative z-10 my-auto py-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/15 text-blue-300 border border-blue-500/25 mb-4">
            <i className="bi bi-cpu" />
            <span>Next-Gen Help Desk AI</span>
          </div>

          <h2 className="text-3xl xl:text-4xl font-bold tracking-tight text-white mb-3 leading-tight">
            Intelligent Incident Management & Self-Service
          </h2>
          <p className="text-slate-400 text-sm xl:text-base mb-6 max-w-lg leading-relaxed">
            Powered by local fine-tuned classification, FAISS vector retrieval, and automated SLA breach risk mitigation.
          </p>

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-lg bg-blue-500/15 flex items-center justify-center text-blue-400 mt-0.5 flex-shrink-0">
                <i className="bi bi-shield-lock-fill text-xs" />
              </div>
              <div>
                <span className="font-semibold text-white text-sm block">Zero Cloud Data Leakage</span>
                <span className="text-slate-400 text-xs">All inferences run strictly on organization-controlled infrastructure.</span>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-lg bg-cyan-500/15 flex items-center justify-center text-cyan-400 mt-0.5 flex-shrink-0">
                <i className="bi bi-search text-xs" />
              </div>
              <div>
                <span className="font-semibold text-white text-sm block">RAG-Grounded Verified Answers</span>
                <span className="text-slate-400 text-xs">Direct citations from approved organization knowledge base guides.</span>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-lg bg-amber-500/15 flex items-center justify-center text-amber-400 mt-0.5 flex-shrink-0">
                <i className="bi bi-clock-history text-xs" />
              </div>
              <div>
                <span className="font-semibold text-white text-sm block">Predictive SLA Breach Prevention</span>
                <span className="text-slate-400 text-xs">Machine learning early-warning alerts for queue congestion and escalations.</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Status Pill */}
        <div className="relative z-10 flex items-center justify-between pt-4 border-t border-slate-800 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
            <span>All System Services Operational</span>
          </div>
          <span>v2.4 Enterprise Edition</span>
        </div>
      </div>

      {/* Right Pane - Authentication Card */}
      <div className="flex-1 flex flex-col justify-center items-center p-4 sm:p-8 md:p-12 relative min-w-0">
        {/* Top-Right Theme Toggle */}
        <div className="absolute top-4 right-4">
          <button
            type="button"
            onClick={toggleTheme}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 bg-white dark:bg-slate-900 shadow-xs transition-colors"
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
          >
            <i className={`bi ${theme === 'dark' ? 'bi-sun-fill text-amber-400' : 'bi-moon-stars text-slate-600'} text-base`} />
          </button>
        </div>

        <div className="w-full max-w-md">
          {/* Mobile Logo Branding */}
          <div className="lg:hidden text-center mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-md mb-2">
              <i className="bi bi-shield-check text-2xl" />
            </div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              SmartHelpdesk
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">AI-Powered Enterprise Help Desk</p>
          </div>

          <div className="mb-6">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Sign in to your account
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Enter your credentials or choose a quick demo account below.
            </p>
          </div>

          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 flex items-start gap-2.5 text-xs text-rose-700 dark:text-rose-300 mb-5">
              <i className="bi bi-exclamation-triangle-fill text-rose-500 text-base flex-shrink-0 mt-0.5" />
              <div className="flex-1 leading-relaxed">{errorMessage}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                Email Address
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-3.5 text-slate-400 text-sm pointer-events-none">
                  <i className="bi bi-envelope" />
                </span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  Password
                </label>
                <span className="text-[11px] text-slate-400">Default: Password123!</span>
              </div>
              <div className="relative flex items-center">
                <span className="absolute left-3.5 text-slate-400 text-sm pointer-events-none">
                  <i className="bi bi-lock" />
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors text-sm"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`} />
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-sm rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
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

          {/* Quick Demo Credentials Showcase */}
          <div className="mt-6 pt-5 border-t border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Quick Demo Accounts
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                Click to Auto-fill
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleDemoSelect('admin@apex.com')}
                className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors flex items-center gap-2.5 text-left group"
              >
                <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xs flex-shrink-0">
                  <i className="bi bi-shield-lock" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    Org Admin
                  </div>
                  <div className="text-[11px] text-slate-400 truncate">admin@apex.com</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleDemoSelect('agent.john@apex.com')}
                className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors flex items-center gap-2.5 text-left group"
              >
                <div className="w-7 h-7 rounded-lg bg-cyan-50 dark:bg-cyan-950/40 text-cyan-600 dark:text-cyan-400 flex items-center justify-center text-xs flex-shrink-0">
                  <i className="bi bi-headset" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
                    Support Agent
                  </div>
                  <div className="text-[11px] text-slate-400 truncate">agent.john@apex.com</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleDemoSelect('lead.it@apex.com')}
                className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors flex items-center gap-2.5 text-left group"
              >
                <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center text-xs flex-shrink-0">
                  <i className="bi bi-diagram-3" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                    Team Lead
                  </div>
                  <div className="text-[11px] text-slate-400 truncate">lead.it@apex.com</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleDemoSelect('user.alice@apex.com')}
                className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors flex items-center gap-2.5 text-left group"
              >
                <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xs flex-shrink-0">
                  <i className="bi bi-person" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                    Employee User
                  </div>
                  <div className="text-[11px] text-slate-400 truncate">user.alice@apex.com</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleDemoSelect('student.emma@greenwood.edu')}
                className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors flex items-center gap-2.5 text-left group"
              >
                <div className="w-7 h-7 rounded-lg bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 flex items-center justify-center text-xs flex-shrink-0">
                  <i className="bi bi-mortarboard" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                    College Student
                  </div>
                  <div className="text-[11px] text-slate-400 truncate">student.emma</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleDemoSelect('sysadmin@smarthelpdesk.local')}
                className="p-2.5 rounded-xl border border-rose-200 dark:border-rose-900/60 hover:border-rose-300 dark:hover:border-rose-700 bg-rose-50/30 dark:bg-rose-950/20 hover:bg-rose-50/60 dark:hover:bg-rose-950/40 transition-colors flex items-center gap-2.5 text-left group"
              >
                <div className="w-7 h-7 rounded-lg bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400 flex items-center justify-center text-xs flex-shrink-0">
                  <i className="bi bi-gear-wide-connected" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-semibold text-rose-700 dark:text-rose-300 truncate">
                    Global SysAdmin
                  </div>
                  <div className="text-[11px] text-rose-500/80 dark:text-rose-400/80 truncate">sysadmin@local</div>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
