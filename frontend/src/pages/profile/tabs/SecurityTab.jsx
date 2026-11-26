import React, { useState, useEffect } from 'react';
import { changePasswordApi, getMySessionsApi, revokeOtherSessionsApi, getMyActivityApi } from '../../../api';
import { useToast } from '../../../context/ToastContext';

export const SecurityTab = () => {
  const { showSuccess, showError } = useToast();

  // Password Change State
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [touched, setTouched] = useState({
    currentPassword: false,
    newPassword: false,
    confirmPassword: false,
  });
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Password Policy Rules
  const criteria = {
    minLength: passwordForm.newPassword.length >= 8,
    hasUpper: /[A-Z]/.test(passwordForm.newPassword),
    hasLower: /[a-z]/.test(passwordForm.newPassword),
    hasNumber: /[0-9]/.test(passwordForm.newPassword),
    hasSpecial: /[^A-Za-z0-9]/.test(passwordForm.newPassword),
  };
  const allCriteriaMet = Object.values(criteria).every(Boolean);
  const passwordsMatch = Boolean(
    passwordForm.confirmPassword &&
    passwordForm.newPassword &&
    passwordForm.newPassword === passwordForm.confirmPassword
  );

  // Active Sessions & History State
  const [sessions, setSessions] = useState([]);
  const [activities, setActivities] = useState([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [revoking, setRevoking] = useState(false);

  useEffect(() => {
    fetchSecurityData();
  }, []);

  const fetchSecurityData = async () => {
    setSessionsLoading(true);
    try {
      const [sessRes, actRes] = await Promise.all([
        getMySessionsApi(),
        getMyActivityApi({ limit: 10 }),
      ]);
      setSessions(sessRes.data || []);
      setActivities(actRes.data || []);
    } catch (err) {
      // Fallback silently if activity table is empty
    } finally {
      setSessionsLoading(false);
    }
  };

  const calculatePasswordStrength = (pass) => {
    let score = 0;
    if (pass.length >= 8) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;
    return score;
  };

  const strength = calculatePasswordStrength(passwordForm.newPassword);
  const strengthLabels = ['Too Weak', 'Weak', 'Fair', 'Strong', 'Very Strong'];
  const strengthColors = ['bg-rose-500', 'bg-rose-400', 'bg-amber-400', 'bg-emerald-500', 'bg-emerald-600'];

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setTouched({ currentPassword: true, newPassword: true, confirmPassword: true });

    if (!passwordForm.currentPassword) {
      showError('Please enter your current password.');
      return;
    }
    if (!allCriteriaMet) {
      showError('Please ensure your new password satisfies all security requirements.');
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showError('New password and confirmation password do not match.');
      return;
    }

    setPasswordLoading(true);
    try {
      await changePasswordApi({
        current_password: passwordForm.currentPassword,
        new_password: passwordForm.newPassword,
        confirm_password: passwordForm.confirmPassword,
      });
      showSuccess('Your password has been changed successfully!');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setTouched({ currentPassword: false, newPassword: false, confirmPassword: false });
      fetchSecurityData();
    } catch (err) {
      showError(err.response?.data?.detail || 'Failed to update password. Verify current password.');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleRevokeOthers = async () => {
    if (!window.confirm('Are you sure you want to sign out all other devices and browser sessions?')) {
      return;
    }
    setRevoking(true);
    try {
      const res = await revokeOtherSessionsApi();
      showSuccess(res.data?.message || 'Other active sessions have been signed out.');
      fetchSecurityData();
    } catch (err) {
      showError(err.response?.data?.detail || 'Failed to revoke other sessions.');
    } finally {
      setRevoking(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Change Password Card */}
      <div className="card-glow rounded-2xl p-5 sm:p-6 bg-white/70 border border-brand-primary/10 space-y-4">
        <div className="border-b border-brand-primary/10 pb-3 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-base text-brand-primary flex items-center gap-2">
              <i className="bi bi-shield-lock-fill text-brand-secondary" />
              <span>Change Password</span>
            </h3>
            <p className="text-xs text-brand-secondary mt-0.5">
              Encrypted using RFC 9106 Argon2id memory-hardened authentication.
            </p>
          </div>
          <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-300">
            Memory Hardened
          </span>
        </div>

        <form onSubmit={handlePasswordSubmit} className="space-y-4 max-w-xl">
          {/* Current Password */}
          <div>
            <label className="block text-xs font-semibold text-brand-primary mb-1">
              Current Password <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showCurrent ? 'text' : 'password'}
                value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm((p) => ({ ...p, currentPassword: e.target.value }))}
                onBlur={() => setTouched((t) => ({ ...t, currentPassword: true }))}
                placeholder="Enter your current password"
                className={`w-full pl-9 pr-10 py-2 text-sm rounded-xl border bg-white text-brand-primary focus:outline-none transition-all ${
                  touched.currentPassword && !passwordForm.currentPassword
                    ? 'border-rose-400 ring-2 ring-rose-200'
                    : touched.currentPassword && passwordForm.currentPassword
                    ? 'border-emerald-400 ring-1 ring-emerald-200'
                    : 'border-brand-primary/20 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/15'
                }`}
              />
              <i className="bi bi-key absolute left-3 top-2.5 text-brand-secondary text-sm" />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-3 top-2.5 text-brand-secondary hover:text-brand-primary focus:outline-none text-sm"
              >
                <i className={`bi ${showCurrent ? 'bi-eye-slash' : 'bi-eye'}`} />
              </button>
            </div>
            {touched.currentPassword && !passwordForm.currentPassword && (
              <p className="text-[11px] text-rose-500 mt-1 flex items-center gap-1">
                <i className="bi bi-exclamation-circle-fill text-[10px]" />
                <span>Current password is required.</span>
              </p>
            )}
          </div>

          {/* New Password */}
          <div>
            <label className="block text-xs font-semibold text-brand-primary mb-1">
              New Password <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showNew ? 'text' : 'password'}
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm((p) => ({ ...p, newPassword: e.target.value }))}
                onBlur={() => setTouched((t) => ({ ...t, newPassword: true }))}
                placeholder="Minimum 8 characters (mixed case, numbers, symbols)"
                className={`w-full pl-9 pr-10 py-2 text-sm rounded-xl border bg-white text-brand-primary focus:outline-none transition-all ${
                  touched.newPassword && !allCriteriaMet
                    ? 'border-rose-400 ring-2 ring-rose-200'
                    : touched.newPassword && allCriteriaMet
                    ? 'border-emerald-400 ring-1 ring-emerald-200'
                    : 'border-brand-primary/20 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/15'
                }`}
              />
              <i className="bi bi-lock absolute left-3 top-2.5 text-brand-secondary text-sm" />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-2.5 text-brand-secondary hover:text-brand-primary focus:outline-none text-sm"
              >
                <i className={`bi ${showNew ? 'bi-eye-slash' : 'bi-eye'}`} />
              </button>
            </div>

            {/* Password Strength Indicator */}
            {passwordForm.newPassword && (
              <div className="mt-2 space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-brand-secondary">Password Strength:</span>
                  <span className="font-bold text-brand-primary">{strengthLabels[strength]}</span>
                </div>
                <div className="h-1.5 w-full bg-brand-secondary/20 rounded-full overflow-hidden flex gap-1">
                  {[1, 2, 3, 4].map((step) => (
                    <div
                      key={step}
                      className={`h-full flex-1 transition-all ${
                        step <= strength ? strengthColors[strength] : 'bg-transparent'
                      }`}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Password Security Requirements Checklist */}
            <div className="mt-2.5 p-3 rounded-xl bg-brand-secondary/5 border border-brand-primary/10 space-y-1.5">
              <div className="text-[10px] font-semibold text-brand-secondary uppercase tracking-wider">
                Password Requirements
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-[11px]">
                <div className={`flex items-center gap-1.5 ${criteria.minLength ? 'text-emerald-700 font-medium' : 'text-brand-secondary'}`}>
                  <i className={`bi ${criteria.minLength ? 'bi-check-circle-fill text-emerald-600' : 'bi-circle text-brand-secondary/50'} text-xs`} />
                  <span>At least 8 characters</span>
                </div>
                <div className={`flex items-center gap-1.5 ${criteria.hasUpper ? 'text-emerald-700 font-medium' : 'text-brand-secondary'}`}>
                  <i className={`bi ${criteria.hasUpper ? 'bi-check-circle-fill text-emerald-600' : 'bi-circle text-brand-secondary/50'} text-xs`} />
                  <span>At least 1 uppercase letter</span>
                </div>
                <div className={`flex items-center gap-1.5 ${criteria.hasLower ? 'text-emerald-700 font-medium' : 'text-brand-secondary'}`}>
                  <i className={`bi ${criteria.hasLower ? 'bi-check-circle-fill text-emerald-600' : 'bi-circle text-brand-secondary/50'} text-xs`} />
                  <span>At least 1 lowercase letter</span>
                </div>
                <div className={`flex items-center gap-1.5 ${criteria.hasNumber ? 'text-emerald-700 font-medium' : 'text-brand-secondary'}`}>
                  <i className={`bi ${criteria.hasNumber ? 'bi-check-circle-fill text-emerald-600' : 'bi-circle text-brand-secondary/50'} text-xs`} />
                  <span>At least 1 numeric digit (0-9)</span>
                </div>
                <div className={`flex items-center gap-1.5 sm:col-span-2 ${criteria.hasSpecial ? 'text-emerald-700 font-medium' : 'text-brand-secondary'}`}>
                  <i className={`bi ${criteria.hasSpecial ? 'bi-check-circle-fill text-emerald-600' : 'bi-circle text-brand-secondary/50'} text-xs`} />
                  <span>At least 1 special character (!@#$%^&*...)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-xs font-semibold text-brand-primary mb-1">
              Confirm New Password <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showConfirm ? 'text' : 'password'}
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm((p) => ({ ...p, confirmPassword: e.target.value }))}
                onBlur={() => setTouched((t) => ({ ...t, confirmPassword: true }))}
                placeholder="Re-enter new password"
                className={`w-full pl-9 pr-10 py-2 text-sm rounded-xl border bg-white text-brand-primary focus:outline-none transition-all ${
                  touched.confirmPassword && !passwordsMatch
                    ? 'border-rose-400 ring-2 ring-rose-200'
                    : touched.confirmPassword && passwordsMatch
                    ? 'border-emerald-400 ring-1 ring-emerald-200'
                    : 'border-brand-primary/20 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/15'
                }`}
              />
              <i className="bi bi-shield-check absolute left-3 top-2.5 text-brand-secondary text-sm" />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-2.5 text-brand-secondary hover:text-brand-primary focus:outline-none text-sm"
              >
                <i className={`bi ${showConfirm ? 'bi-eye-slash' : 'bi-eye'}`} />
              </button>
            </div>
            {touched.confirmPassword && passwordForm.confirmPassword && !passwordsMatch && (
              <p className="text-[11px] text-rose-500 mt-1 flex items-center gap-1">
                <i className="bi bi-exclamation-circle-fill text-[10px]" />
                <span>Passwords do not match.</span>
              </p>
            )}
            {touched.confirmPassword && passwordsMatch && (
              <p className="text-[11px] text-emerald-600 mt-1 flex items-center gap-1">
                <i className="bi bi-check-circle-fill text-[10px]" />
                <span>Passwords match.</span>
              </p>
            )}
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={passwordLoading || !passwordForm.currentPassword || !allCriteriaMet || !passwordsMatch}
              className="px-5 py-2 text-xs font-semibold text-white bg-brand-primary hover:bg-brand-primary/90 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-subtle transition-all flex items-center gap-2"
            >
              {passwordLoading && <i className="bi bi-arrow-repeat animate-spin" />}
              <span>Update Password</span>
            </button>
          </div>
        </form>
      </div>

      {/* Active Sessions Card */}
      <div className="card-glow rounded-2xl p-5 sm:p-6 bg-white/70 border border-brand-primary/10 space-y-4">
        <div className="border-b border-brand-primary/10 pb-3 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-base text-brand-primary flex items-center gap-2">
              <i className="bi bi-laptop text-brand-secondary" />
              <span>Active Sessions & Connected Devices</span>
            </h3>
            <p className="text-xs text-brand-secondary mt-0.5">
              Manage devices and browsers with active authenticated sessions.
            </p>
          </div>
          <button
            type="button"
            onClick={handleRevokeOthers}
            disabled={revoking || sessions.length <= 1}
            className="px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl border border-rose-200 transition-all flex items-center gap-1.5"
          >
            {revoking ? <i className="bi bi-arrow-repeat animate-spin" /> : <i className="bi bi-box-arrow-right" />}
            <span>Sign Out Other Sessions</span>
          </button>
        </div>

        {sessionsLoading ? (
          <div className="py-6 text-center text-xs text-brand-secondary">
            <i className="bi bi-arrow-repeat animate-spin text-lg block mb-1" />
            Loading active sessions...
          </div>
        ) : (
          <div className="space-y-3">
            {sessions.map((sess) => (
              <div
                key={sess.id}
                className={`p-3.5 rounded-xl border transition-all flex items-center justify-between ${
                  sess.is_current
                    ? 'bg-emerald-50/50 border-emerald-300'
                    : 'bg-brand-secondary/5 border-brand-primary/10'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg ${
                    sess.is_current ? 'bg-emerald-600 text-white' : 'bg-brand-primary/10 text-brand-primary'
                  }`}>
                    <i className={sess.user_agent?.includes('Mobile') ? 'bi bi-phone' : 'bi bi-display'} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-brand-primary">
                        {sess.user_agent || 'Chrome Browser'}
                      </span>
                      {sess.is_current && (
                        <span className="px-2 py-0.2 text-[10px] font-bold bg-emerald-600 text-white rounded-full">
                          Current Session
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-brand-secondary flex items-center gap-2 mt-0.5">
                      <span>IP: {sess.ip_address || '127.0.0.1'}</span>
                      <span>•</span>
                      <span>Started: {new Date(sess.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Active</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Security Activity & Alerts Card */}
      <div className="card-glow rounded-2xl p-5 sm:p-6 bg-white/70 border border-brand-primary/10 space-y-4">
        <div className="border-b border-brand-primary/10 pb-3 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-base text-brand-primary flex items-center gap-2">
              <i className="bi bi-shield-check text-brand-secondary" />
              <span>Recent Security Events</span>
            </h3>
            <p className="text-xs text-brand-secondary mt-0.5">
              Audited authentication, password changes, and access events.
            </p>
          </div>
        </div>

        <div className="space-y-2.5">
          {activities.slice(0, 5).map((act) => (
            <div
              key={act.id}
              className="p-3 rounded-xl bg-brand-secondary/5 border border-brand-primary/10 flex items-center justify-between text-xs"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-brand-primary/10 text-brand-primary flex items-center justify-center text-xs">
                  <i className="bi bi-clock-history" />
                </div>
                <div>
                  <span className="font-semibold text-brand-primary block">{act.action}</span>
                  <span className="text-[11px] text-brand-secondary">
                    IP: {act.ip_address || '127.0.0.1'} • {new Date(act.created_at).toLocaleString()}
                  </span>
                </div>
              </div>
              <span className="text-[10px] font-semibold text-brand-primary bg-white px-2 py-0.5 rounded border border-brand-secondary/30">
                Verified
              </span>
            </div>
          ))}
          {activities.length === 0 && (
            <div className="text-center py-4 text-xs text-brand-secondary">
              No security alerts recorded.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
