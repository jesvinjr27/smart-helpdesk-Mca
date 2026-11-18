import React, { useState } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { resetPasswordApi } from '../../api';
import { useToast } from '../../context/ToastContext';
import { validateNewPassword, validateConfirmPassword } from '../../auth/utils/validation';

export const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const tokenFromUrl = searchParams.get('token') || '';

  const [token, setToken] = useState(tokenFromUrl);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const [errors, setErrors] = useState({ token: '', newPassword: '', confirmPassword: '' });
  const [touched, setTouched] = useState({ token: false, newPassword: false, confirmPassword: false });

  const { showError } = useToast();
  const navigate = useNavigate();

  const handleNewPasswordChange = (e) => {
    const val = e.target.value;
    setNewPassword(val);
    if (touched.newPassword || errors.newPassword) {
      const res = validateNewPassword(val);
      setErrors((prev) => ({ ...prev, newPassword: res.error }));
    }
    if (touched.confirmPassword && confirmPassword) {
      const matchRes = validateConfirmPassword(val, confirmPassword);
      setErrors((prev) => ({ ...prev, confirmPassword: matchRes.error }));
    }
  };

  const handleConfirmPasswordChange = (e) => {
    const val = e.target.value;
    setConfirmPassword(val);
    if (touched.confirmPassword || errors.confirmPassword) {
      const res = validateConfirmPassword(newPassword, val);
      setErrors((prev) => ({ ...prev, confirmPassword: res.error }));
    }
  };

  const handleNewPasswordBlur = () => {
    setTouched((prev) => ({ ...prev, newPassword: true }));
    const res = validateNewPassword(newPassword);
    setErrors((prev) => ({ ...prev, newPassword: res.error }));
  };

  const handleConfirmPasswordBlur = () => {
    setTouched((prev) => ({ ...prev, confirmPassword: true }));
    const res = validateConfirmPassword(newPassword, confirmPassword);
    setErrors((prev) => ({ ...prev, confirmPassword: res.error }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (loading) return; // Prevent duplicate requests

    setTouched({ token: true, newPassword: true, confirmPassword: true });

    let tokenError = null;
    if (!token.trim()) {
      tokenError = 'A valid password reset token is required.';
    }

    const passRes = validateNewPassword(newPassword);
    const confirmRes = validateConfirmPassword(newPassword, confirmPassword);

    const newErrors = {
      token: tokenError,
      newPassword: passRes.error,
      confirmPassword: confirmRes.error,
    };
    setErrors(newErrors);

    if (tokenError || !passRes.isValid || !confirmRes.isValid) {
      const firstError = tokenError || passRes.error || confirmRes.error;
      showError(firstError);
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
      const msg =
        err.response?.data?.detail || err.message || 'Password reset failed. The link may have expired.';
      showError(msg);
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
          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            {!tokenFromUrl && (
              <div>
                <label
                  htmlFor="reset-token"
                  className="block text-xs font-semibold uppercase tracking-wider text-brand-primary mb-1.5"
                >
                  Reset Token
                </label>
                <input
                  id="reset-token"
                  type="text"
                  value={token}
                  onChange={(e) => {
                    setToken(e.target.value);
                    if (errors.token) setErrors((prev) => ({ ...prev, token: '' }));
                  }}
                  onBlur={() => {
                    setTouched((prev) => ({ ...prev, token: true }));
                    if (!token.trim()) {
                      setErrors((prev) => ({ ...prev, token: 'Reset token is required.' }));
                    }
                  }}
                  placeholder="Paste reset token here"
                  aria-invalid={errors.token && touched.token ? 'true' : 'false'}
                  aria-describedby={errors.token && touched.token ? 'token-error' : undefined}
                  className={`w-full px-3.5 py-2.5 text-sm rounded-xl text-brand-primary placeholder:text-brand-secondary/60 focus:outline-none font-mono text-xs transition-all ${
                    errors.token && touched.token ? 'input-error' : 'input-glow'
                  }`}
                />
                {errors.token && touched.token && (
                  <p
                    id="token-error"
                    role="alert"
                    className="text-xs text-[#DC2626] mt-1.5 flex items-center gap-1.5 font-medium animate-fadeIn"
                  >
                    <i className="bi bi-exclamation-circle-fill text-xs flex-shrink-0" />
                    <span>{errors.token}</span>
                  </p>
                )}
              </div>
            )}

            <div>
              <label
                htmlFor="new-password"
                className="block text-xs font-semibold uppercase tracking-wider text-brand-primary mb-1.5"
              >
                New Password
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-3.5 text-brand-secondary text-sm pointer-events-none">
                  <i className="bi bi-lock" />
                </span>
                <input
                  id="new-password"
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={handleNewPasswordChange}
                  onBlur={handleNewPasswordBlur}
                  placeholder="Minimum 8 characters"
                  aria-invalid={errors.newPassword && touched.newPassword ? 'true' : 'false'}
                  aria-describedby={errors.newPassword && touched.newPassword ? 'new-password-error' : undefined}
                  className={`w-full pl-10 pr-10 py-2.5 text-sm rounded-xl text-brand-primary placeholder:text-brand-secondary/60 focus:outline-none transition-all ${
                    errors.newPassword && touched.newPassword ? 'input-error' : 'input-glow'
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
              {errors.newPassword && touched.newPassword && (
                <p
                  id="new-password-error"
                  role="alert"
                  className="text-xs text-[#DC2626] mt-1.5 flex items-center gap-1.5 font-medium animate-fadeIn"
                >
                  <i className="bi bi-exclamation-circle-fill text-xs flex-shrink-0" />
                  <span>{errors.newPassword}</span>
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="confirm-password"
                className="block text-xs font-semibold uppercase tracking-wider text-brand-primary mb-1.5"
              >
                Confirm New Password
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-3.5 text-brand-secondary text-sm pointer-events-none">
                  <i className="bi bi-lock-fill" />
                </span>
                <input
                  id="confirm-password"
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={handleConfirmPasswordChange}
                  onBlur={handleConfirmPasswordBlur}
                  placeholder="Re-type password"
                  aria-invalid={errors.confirmPassword && touched.confirmPassword ? 'true' : 'false'}
                  aria-describedby={errors.confirmPassword && touched.confirmPassword ? 'confirm-password-error' : undefined}
                  className={`w-full pl-10 pr-3.5 py-2.5 text-sm rounded-xl text-brand-primary placeholder:text-brand-secondary/60 focus:outline-none transition-all ${
                    errors.confirmPassword && touched.confirmPassword ? 'input-error' : 'input-glow'
                  }`}
                />
              </div>
              {errors.confirmPassword && touched.confirmPassword && (
                <p
                  id="confirm-password-error"
                  role="alert"
                  className="text-xs text-[#DC2626] mt-1.5 flex items-center gap-1.5 font-medium animate-fadeIn"
                >
                  <i className="bi bi-exclamation-circle-fill text-xs flex-shrink-0" />
                  <span>{errors.confirmPassword}</span>
                </p>
              )}
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
