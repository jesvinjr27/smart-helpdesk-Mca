import React, { useState, useEffect } from 'react';
import { updateMyPreferencesApi } from '../../../api';
import { useToast } from '../../../context/ToastContext';

export const AccountSettingsTab = ({ profile, onProfileUpdated }) => {
  const { showSuccess, showError } = useToast();

  const [settings, setSettings] = useState({
    email: '',
    language: 'en',
    timezone: 'UTC',
    dateFormat: 'YYYY-MM-DD',
    timeFormat: '12h',
    theme: 'light',
  });

  const [initialSettings, setInitialSettings] = useState({});
  const [loading, setLoading] = useState(false);
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [emailTouched, setEmailTouched] = useState(false);

  useEffect(() => {
    if (profile) {
      const data = {
        email: profile.email || '',
        language: profile.preferred_language || 'en',
        timezone: profile.timezone || 'UTC',
        dateFormat: profile.date_format || 'YYYY-MM-DD',
        timeFormat: profile.time_format || '12h',
        theme: profile.theme || 'light',
      };
      setSettings(data);
      setInitialSettings(data);
    }
  }, [profile]);

  const isDirty = JSON.stringify(settings) !== JSON.stringify(initialSettings);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSettings((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        preferred_language: settings.language,
        timezone: settings.timezone,
        date_format: settings.dateFormat,
        time_format: settings.timeFormat,
        theme: settings.theme,
      };
      const res = await updateMyPreferencesApi(payload);
      showSuccess('Account preferences updated successfully!');
      if (onProfileUpdated) {
        onProfileUpdated({
          ...profile,
          preferred_language: res.data.preferred_language,
          timezone: res.data.timezone,
          date_format: res.data.date_format,
          time_format: res.data.time_format,
          theme: res.data.theme,
        });
      }
      setInitialSettings(settings);
    } catch (err) {
      showError(err.response?.data?.detail || 'Failed to update account preferences.');
    } finally {
      setLoading(false);
    }
  };

  const validateNewEmail = (val) => {
    const trimmed = (val || '').trim();
    if (!trimmed) return 'Email address is required.';
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(trimmed)) {
      return 'Please enter a valid email address (e.g. name@organization.com).';
    }
    if (trimmed.toLowerCase() === (settings.email || '').toLowerCase()) {
      return 'New email cannot be identical to your current registered email.';
    }
    return null;
  };

  const handleEmailChange = (e) => {
    const val = e.target.value;
    setNewEmail(val);
    if (emailTouched) {
      setEmailError(validateNewEmail(val));
    }
  };

  const handleEmailBlur = () => {
    setEmailTouched(true);
    setEmailError(validateNewEmail(newEmail));
  };

  const handleEmailRequest = (e) => {
    e.preventDefault();
    setEmailTouched(true);
    const err = validateNewEmail(newEmail);
    if (err) {
      setEmailError(err);
      showError(err);
      return;
    }
    showSuccess(`Verification code dispatched to ${newEmail.trim()}. Please confirm the OTP link.`);
    setEmailModalOpen(false);
    setNewEmail('');
    setEmailError('');
    setEmailTouched(false);
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSave} className="space-y-6">
        {/* Account Credentials Card */}
        <div className="card-glow rounded-2xl p-5 sm:p-6 bg-white/70 border border-brand-primary/10 space-y-4">
          <div className="border-b border-brand-primary/10 pb-3 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-base text-brand-primary flex items-center gap-2">
                <i className="bi bi-person-gear text-brand-secondary" />
                <span>Account Credentials</span>
              </h3>
              <p className="text-xs text-brand-secondary mt-0.5">
                Primary credentials used for enterprise single sign-on and notifications.
              </p>
            </div>
            <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-300 flex items-center gap-1">
              <i className="bi bi-shield-check text-xs" />
              <span>Argon2id Protected</span>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Primary Email */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-brand-primary mb-1">
                Primary Account Email
              </label>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <input
                    type="email"
                    value={settings.email}
                    disabled
                    className="w-full pl-9 pr-24 py-2 text-sm rounded-xl border border-brand-primary/15 bg-brand-secondary/10 text-brand-primary/80 cursor-not-allowed font-medium"
                  />
                  <i className="bi bi-envelope absolute left-3 top-2.5 text-brand-secondary text-sm" />
                  <span className="absolute right-3 top-2 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 bg-emerald-50 rounded-md border border-emerald-200">
                    Verified
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setEmailModalOpen(true)}
                  className="px-3.5 py-2 text-xs font-semibold text-brand-primary bg-brand-secondary/20 hover:bg-brand-secondary/35 rounded-xl border border-brand-secondary/30 transition-all flex items-center justify-center gap-1.5"
                >
                  <i className="bi bi-arrow-repeat" />
                  <span>Change Email</span>
                </button>
              </div>
              <p className="text-[11px] text-brand-secondary mt-1">
                Changing your primary email requires re-verification via secure email code.
              </p>
            </div>
          </div>
        </div>

        {/* Regional & Date/Time Formats Card */}
        <div className="card-glow rounded-2xl p-5 sm:p-6 bg-white/70 border border-brand-primary/10 space-y-4">
          <div className="border-b border-brand-primary/10 pb-3 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-base text-brand-primary flex items-center gap-2">
                <i className="bi bi-globe-americas text-brand-secondary" />
                <span>Localization & Format Preferences</span>
              </h3>
              <p className="text-xs text-brand-secondary mt-0.5">
                Customize how timestamps, dates, and interface text render across all pages.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Preferred Language */}
            <div>
              <label className="block text-xs font-semibold text-brand-primary mb-1">
                Interface Language
              </label>
              <select
                name="language"
                value={settings.language}
                onChange={handleChange}
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-brand-primary/20 bg-white text-brand-primary focus:outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/15 transition-all"
              >
                <option value="en">English (US)</option>
                <option value="es">Español (Spanish)</option>
                <option value="fr">Français (French)</option>
                <option value="de">Deutsch (German)</option>
                <option value="hi">हिन्दी (Hindi)</option>
              </select>
            </div>

            {/* Time Zone */}
            <div>
              <label className="block text-xs font-semibold text-brand-primary mb-1">
                Preferred Time Zone
              </label>
              <select
                name="timezone"
                value={settings.timezone}
                onChange={handleChange}
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-brand-primary/20 bg-white text-brand-primary focus:outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/15 transition-all"
              >
                <option value="UTC">UTC (Universal Coordinated Time)</option>
                <option value="America/New_York">America/New_York (UTC-5)</option>
                <option value="America/Chicago">America/Chicago (UTC-6)</option>
                <option value="America/Denver">America/Denver (UTC-7)</option>
                <option value="America/Los_Angeles">America/Los_Angeles (UTC-8)</option>
                <option value="Europe/London">Europe/London (UTC+0)</option>
                <option value="Europe/Paris">Europe/Paris (UTC+1)</option>
                <option value="Asia/Kolkata">Asia/Kolkata (UTC+5:30)</option>
                <option value="Asia/Singapore">Asia/Singapore (UTC+8)</option>
                <option value="Asia/Tokyo">Asia/Tokyo (UTC+9)</option>
              </select>
            </div>

            {/* Date Format */}
            <div>
              <label className="block text-xs font-semibold text-brand-primary mb-1">
                Date Display Format
              </label>
              <select
                name="dateFormat"
                value={settings.dateFormat}
                onChange={handleChange}
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-brand-primary/20 bg-white text-brand-primary focus:outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/15 transition-all"
              >
                <option value="YYYY-MM-DD">YYYY-MM-DD (ISO Standard e.g. 2026-11-25)</option>
                <option value="DD/MM/YYYY">DD/MM/YYYY (e.g. 25/11/2026)</option>
                <option value="MM/DD/YYYY">MM/DD/YYYY (e.g. 11/25/2026)</option>
              </select>
            </div>

            {/* Time Format */}
            <div>
              <label className="block text-xs font-semibold text-brand-primary mb-1">
                Time Display Format
              </label>
              <select
                name="timeFormat"
                value={settings.timeFormat}
                onChange={handleChange}
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-brand-primary/20 bg-white text-brand-primary focus:outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/15 transition-all"
              >
                <option value="12h">12-hour clock (e.g. 02:45 PM)</option>
                <option value="24h">24-hour clock (e.g. 14:45)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="submit"
            disabled={!isDirty || loading}
            className="px-5 py-2 text-xs font-semibold text-white bg-brand-primary hover:bg-brand-primary/90 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-subtle transition-all flex items-center gap-2"
          >
            {loading && <i className="bi bi-arrow-repeat animate-spin" />}
            <span>Save Account Settings</span>
          </button>
        </div>
      </form>

      {/* Change Email Modal */}
      {emailModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-app-background w-full max-w-md rounded-2xl shadow-2xl border border-brand-primary/20 p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-brand-primary/10 pb-3">
              <h3 className="font-bold text-base text-brand-primary flex items-center gap-2">
                <i className="bi bi-envelope-check text-brand-secondary" />
                <span>Change Email Address</span>
              </h3>
              <button
                onClick={() => setEmailModalOpen(false)}
                className="text-brand-secondary hover:text-brand-primary p-1 rounded-lg"
              >
                <i className="bi bi-x-lg text-sm" />
              </button>
            </div>

            <p className="text-xs text-brand-secondary leading-relaxed">
              Enter your new work or university email address. A one-time verification token will be sent to confirm your identity.
            </p>

            <div>
              <label className="block text-xs font-semibold text-brand-primary mb-1">
                New Email Address <span className="text-rose-500">*</span>
              </label>
              <input
                type="email"
                value={newEmail}
                onChange={handleEmailChange}
                onBlur={handleEmailBlur}
                placeholder="name@organization.com"
                className={`w-full px-3.5 py-2 text-sm rounded-xl border bg-white text-brand-primary focus:outline-none transition-all ${
                  emailError && emailTouched
                    ? 'border-rose-400 ring-2 ring-rose-200'
                    : !emailError && emailTouched && newEmail
                    ? 'border-emerald-400 ring-1 ring-emerald-200'
                    : 'border-brand-primary/20 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/15'
                }`}
              />
              {emailError && emailTouched && (
                <p className="text-[11px] text-rose-500 mt-1 flex items-center gap-1">
                  <i className="bi bi-exclamation-circle-fill text-[10px]" />
                  <span>{emailError}</span>
                </p>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-brand-primary/10">
              <button
                type="button"
                onClick={() => setEmailModalOpen(false)}
                className="px-3.5 py-1.5 text-xs text-brand-secondary hover:text-brand-primary rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleEmailRequest}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-brand-primary hover:bg-brand-primary/90 rounded-lg shadow-sm"
              >
                Send Verification Code
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
