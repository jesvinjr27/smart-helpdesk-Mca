import React, { useState } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { resetPasswordApi } from '../../api';

export const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const tokenFromUrl = searchParams.get('token') || '';

  const [token, setToken] = useState(tokenFromUrl);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!token.trim()) {
      setErrorMessage('A valid password reset token is required.');
      return;
    }

    if (newPassword.length < 8) {
      setErrorMessage('Password must be at least 8 characters in length.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please verify your entries.');
      return;
    }

    setLoading(true);

    try {
      await resetPasswordApi({
        token: token.trim(),
        new_password: newPassword,
      });
      setIsSuccess(true);
    } catch (err) {
      setErrorMessage(
        err.response?.data?.detail || err.message || 'Password reset failed. The link may have expired.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen min-h-[100dvh] flex flex-col justify-center items-center p-4 sm:p-6 bg-app-background font-sans text-brand-primary">
      <div className="w-full max-w-md card-glow p-6 sm:p-8 rounded-2xl relative">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-brand-primary text-white shadow-subtle mb-3">
            <i className="bi bi-shield-lock-fill text-2xl" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-brand-primary">
            Set New Password
          </h1>
          <p className="text-sm text-brand-secondary mt-1">
            Create a strong, unique password for your Smart Help Desk account.
          </p>
        </div>

        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-brand-primary/10 border border-brand-primary/30 flex items-start gap-2.5 text-xs text-brand-primary mb-5">
            <i className="bi bi-exclamation-triangle-fill text-brand-primary text-base flex-shrink-0 mt-0.5" />
            <div className="flex-1 leading-relaxed">{errorMessage}</div>
          </div>
        )}

        {isSuccess ? (
          <div className="space-y-4 text-center">
            <div className="p-4 rounded-xl bg-brand-accent/25 border border-brand-secondary/40 text-xs text-brand-primary text-left">
              <div className="flex items-start gap-2.5">
                <i className="bi bi-check-circle-fill text-brand-primary text-lg flex-shrink-0 mt-0.5" />
                <div className="flex-1 leading-relaxed">
                  <span className="font-bold block mb-1">Password updated successfully</span>
                  Your account password has been updated and legacy sessions have been safely revoked. You can now sign in.
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => navigate('/login')}
              className="w-full py-2.5 px-4 bg-brand-primary hover:bg-brand-primary/90 text-white font-semibold text-sm rounded-xl shadow-subtle transition-all flex items-center justify-center gap-2"
            >
              <span>Sign In with New Password</span>
              <i className="bi bi-arrow-right" />
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {!tokenFromUrl && (
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-brand-primary mb-1.5">
                  Reset Token
                </label>
                <input
                  type="text"
                  required
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="Paste reset token here"
                  className="w-full px-3.5 py-2.5 text-sm input-glow rounded-xl text-brand-primary placeholder:text-brand-secondary/60 focus:outline-none font-mono text-xs"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-brand-primary mb-1.5">
                New Password
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-3.5 text-brand-secondary text-sm pointer-events-none">
                  <i className="bi bi-lock" />
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimum 8 characters"
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

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-brand-primary mb-1.5">
                Confirm New Password
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-3.5 text-brand-secondary text-sm pointer-events-none">
                  <i className="bi bi-lock-fill" />
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-type password"
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
                  <span>Updating Password...</span>
                </>
              ) : (
                <>
                  <span>Save New Password</span>
                  <i className="bi bi-check-lg" />
                </>
              )}
            </button>

            <div className="pt-2 text-center">
              <Link
                to="/login"
                className="text-xs font-semibold text-brand-secondary hover:text-brand-primary transition-colors inline-flex items-center gap-1.5"
              >
                <i className="bi bi-arrow-left" />
                <span>Cancel and return to Sign In</span>
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
