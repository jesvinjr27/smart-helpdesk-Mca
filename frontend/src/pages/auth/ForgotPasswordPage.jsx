import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { forgotPasswordApi } from '../../api';

export const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [devToken, setDevToken] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    setDevToken('');
    setLoading(true);

    try {
      const resp = await forgotPasswordApi({ email });
      setSuccessMessage(resp.data?.message || 'If an account exists with this email, instructions have been sent.');
      if (resp.data?.detail && resp.data.detail.includes('token: ')) {
        const token = resp.data.detail.split('token: ')[1];
        setDevToken(token);
      }
    } catch (err) {
      setErrorMessage(err.response?.data?.detail || err.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen min-h-[100dvh] flex flex-col justify-center items-center p-4 sm:p-6 bg-app-background font-sans text-brand-primary">
      <div className="w-full max-w-md card-glow p-6 sm:p-8 rounded-2xl relative">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-brand-primary text-white shadow-subtle mb-3">
            <i className="bi bi-key-fill text-2xl" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-brand-primary">
            Reset Password
          </h1>
          <p className="text-sm text-brand-secondary mt-1">
            Enter your registered email address to receive password recovery instructions.
          </p>
        </div>

        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-brand-primary/10 border border-brand-primary/30 flex items-start gap-2.5 text-xs text-brand-primary mb-5">
            <i className="bi bi-exclamation-triangle-fill text-brand-primary text-base flex-shrink-0 mt-0.5" />
            <div className="flex-1 leading-relaxed">{errorMessage}</div>
          </div>
        )}

        {successMessage ? (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-brand-accent/25 border border-brand-secondary/40 text-xs text-brand-primary">
              <div className="flex items-start gap-2.5">
                <i className="bi bi-check-circle-fill text-brand-primary text-lg flex-shrink-0 mt-0.5" />
                <div className="flex-1 leading-relaxed">
                  <span className="font-bold block mb-1">Check your inbox</span>
                  {successMessage}
                </div>
              </div>
            </div>

            {/* Development-mode direct test link */}
            {devToken && (
              <div className="p-3.5 rounded-xl bg-brand-secondary/15 border border-brand-secondary/30 text-xs">
                <span className="font-bold text-brand-primary block mb-1.5 flex items-center gap-1.5">
                  <i className="bi bi-code-square" />
                  <span>Development Mode Token Detected</span>
                </span>
                <p className="text-[11px] text-brand-secondary mb-2.5">
                  In development environment without active SMTP, you can proceed directly with the generated secure token:
                </p>
                <Link
                  to={`/reset-password?token=${devToken}`}
                  className="w-full py-2 px-3 bg-brand-primary text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-2 hover:bg-brand-primary/90 transition-all"
                >
                  <span>Open Reset Password Screen</span>
                  <i className="bi bi-arrow-right" />
                </Link>
              </div>
            )}

            <div className="pt-3 text-center">
              <Link
                to="/login"
                className="text-xs font-semibold text-brand-primary hover:text-brand-secondary transition-colors inline-flex items-center gap-1.5"
              >
                <i className="bi bi-arrow-left" />
                <span>Return to Sign In</span>
              </Link>
            </div>
          </div>
        ) : (
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
                  placeholder="name@company.com"
                  className="w-full pl-10 pr-3.5 py-2.5 text-sm input-glow rounded-xl text-brand-primary placeholder:text-brand-secondary/60 focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-brand-primary hover:bg-brand-primary/90 text-white font-semibold text-sm rounded-xl shadow-subtle transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Verifying...</span>
                </>
              ) : (
                <>
                  <span>Send Reset Link</span>
                  <i className="bi bi-envelope-paper" />
                </>
              )}
            </button>

            <div className="pt-2 text-center">
              <Link
                to="/login"
                className="text-xs font-semibold text-brand-secondary hover:text-brand-primary transition-colors inline-flex items-center gap-1.5"
              >
                <i className="bi bi-arrow-left" />
                <span>Back to Sign In</span>
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
