import React, { useState, useEffect } from 'react';
import { updateMyPreferencesApi } from '../../../api';
import { useToast } from '../../../context/ToastContext';

export const PreferencesTab = ({ profile, onProfileUpdated }) => {
  const { showSuccess, showError } = useToast();

  const [preferences, setPreferences] = useState({
    theme: 'light',
    tablePageSize: 10,
    reduceMotion: false,
    highContrast: false,
    fontSize: 'normal',
  });

  const [initialPreferences, setInitialPreferences] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (profile) {
      const access = profile.accessibility_preferences || {};
      const data = {
        theme: profile.theme || 'light',
        tablePageSize: profile.table_page_size || 10,
        reduceMotion: access.reduce_motion || false,
        highContrast: access.high_contrast || false,
        fontSize: access.font_size || 'normal',
      };
      setPreferences(data);
      setInitialPreferences(data);
    }
  }, [profile]);

  const isDirty = JSON.stringify(preferences) !== JSON.stringify(initialPreferences);

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        theme: preferences.theme,
        table_page_size: preferences.tablePageSize,
        accessibility_preferences: {
          reduce_motion: preferences.reduceMotion,
          high_contrast: preferences.highContrast,
          font_size: preferences.fontSize,
        },
      };

      const res = await updateMyPreferencesApi(payload);
      showSuccess('Application preferences saved!');
      if (onProfileUpdated && profile) {
        onProfileUpdated({
          ...profile,
          theme: res.data.theme,
          table_page_size: res.data.table_page_size,
          accessibility_preferences: res.data.accessibility_preferences,
        });
      }
      setInitialPreferences(preferences);
    } catch (err) {
      showError(err.response?.data?.detail || 'Failed to update preferences.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSave} className="space-y-6">
        {/* Theme & Appearance */}
        <div className="card-glow rounded-2xl p-5 sm:p-6 bg-white/70 border border-brand-primary/10 space-y-4">
          <div className="border-b border-brand-primary/10 pb-3">
            <h3 className="font-bold text-base text-brand-primary flex items-center gap-2">
              <i className="bi bi-palette-fill text-brand-secondary" />
              <span>Appearance & Color Theme</span>
            </h3>
            <p className="text-xs text-brand-secondary mt-0.5">
              Select your preferred visual style across all help desk modules.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            {/* Light Theme */}
            <div
              onClick={() => setPreferences((p) => ({ ...p, theme: 'light' }))}
              className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                preferences.theme === 'light'
                  ? 'border-brand-primary bg-brand-accent/20 shadow-sm'
                  : 'border-brand-primary/15 hover:border-brand-primary/40 bg-white'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-xs text-brand-primary">Clean Light Mode</span>
                {preferences.theme === 'light' && (
                  <i className="bi bi-check-circle-fill text-brand-primary text-sm" />
                )}
              </div>
              <div className="h-10 rounded-lg bg-[#f7f8f0] border border-[#355872]/20 flex items-center justify-center text-xs text-brand-primary font-medium">
                Official Helpdesk Palette
              </div>
              <p className="text-[11px] text-brand-secondary mt-2">
                High clarity, cream backdrop with deep navy typography.
              </p>
            </div>

            {/* Dark Theme */}
            <div
              onClick={() => setPreferences((p) => ({ ...p, theme: 'dark' }))}
              className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                preferences.theme === 'dark'
                  ? 'border-brand-primary bg-brand-accent/20 shadow-sm'
                  : 'border-brand-primary/15 hover:border-brand-primary/40 bg-white'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-xs text-brand-primary">Dark Contrast</span>
                {preferences.theme === 'dark' && (
                  <i className="bi bi-check-circle-fill text-brand-primary text-sm" />
                )}
              </div>
              <div className="h-10 rounded-lg bg-[#355872] text-white flex items-center justify-center text-xs font-medium">
                Night Shift Mode
              </div>
              <p className="text-[11px] text-brand-secondary mt-2">
                Reduced eye strain in low-light environments.
              </p>
            </div>

            {/* System Sync */}
            <div
              onClick={() => setPreferences((p) => ({ ...p, theme: 'system' }))}
              className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                preferences.theme === 'system'
                  ? 'border-brand-primary bg-brand-accent/20 shadow-sm'
                  : 'border-brand-primary/15 hover:border-brand-primary/40 bg-white'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-xs text-brand-primary">System Match</span>
                {preferences.theme === 'system' && (
                  <i className="bi bi-check-circle-fill text-brand-primary text-sm" />
                )}
              </div>
              <div className="h-10 rounded-lg bg-gradient-to-r from-[#f7f8f0] to-[#355872] flex items-center justify-center text-xs font-medium text-brand-primary">
                OS Synchronized
              </div>
              <p className="text-[11px] text-brand-secondary mt-2">
                Automatically toggles based on operating system theme.
              </p>
            </div>
          </div>
        </div>

        {/* Data Presentation & Tables */}
        <div className="card-glow rounded-2xl p-5 sm:p-6 bg-white/70 border border-brand-primary/10 space-y-4">
          <div className="border-b border-brand-primary/10 pb-3">
            <h3 className="font-bold text-base text-brand-primary flex items-center gap-2">
              <i className="bi bi-table text-brand-secondary" />
              <span>Data Presentation & Tables</span>
            </h3>
            <p className="text-xs text-brand-secondary mt-0.5">
              Control the default pagination length for tickets and knowledge lists.
            </p>
          </div>

          <div className="max-w-xs">
            <label className="block text-xs font-semibold text-brand-primary mb-1">
              Default Table Rows Per Page
            </label>
            <select
              value={preferences.tablePageSize}
              onChange={(e) =>
                setPreferences((p) => ({ ...p, tablePageSize: Number(e.target.value) }))
              }
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-brand-primary/20 bg-white text-brand-primary focus:outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/15"
            >
              <option value={10}>10 records per page (Standard)</option>
              <option value={20}>20 records per page (Dense)</option>
              <option value={50}>50 records per page (Maximum)</option>
            </select>
          </div>
        </div>

        {/* Accessibility Options */}
        <div className="card-glow rounded-2xl p-5 sm:p-6 bg-white/70 border border-brand-primary/10 space-y-4">
          <div className="border-b border-brand-primary/10 pb-3">
            <h3 className="font-bold text-base text-brand-primary flex items-center gap-2">
              <i className="bi bi-universal-access text-brand-secondary" />
              <span>Accessibility & Motion</span>
            </h3>
            <p className="text-xs text-brand-secondary mt-0.5">
              Enhanced contrast and reduced animations for improved usability.
            </p>
          </div>

          <div className="space-y-3">
            <label className="flex items-center justify-between p-3 rounded-xl bg-brand-secondary/5 border border-brand-primary/10 cursor-pointer hover:bg-brand-secondary/10 transition-colors">
              <div>
                <span className="font-semibold text-xs text-brand-primary block">
                  Reduce Interface Motion & Animations
                </span>
                <span className="text-[11px] text-brand-secondary">
                  Disables smooth transitions and spin animations for improved comfort.
                </span>
              </div>
              <input
                type="checkbox"
                checked={preferences.reduceMotion}
                onChange={(e) =>
                  setPreferences((p) => ({ ...p, reduceMotion: e.target.checked }))
                }
                className="w-4 h-4 text-brand-primary rounded focus:ring-brand-primary"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-xl bg-brand-secondary/5 border border-brand-primary/10 cursor-pointer hover:bg-brand-secondary/10 transition-colors">
              <div>
                <span className="font-semibold text-xs text-brand-primary block">
                  High Contrast Border Accents
                </span>
                <span className="text-[11px] text-brand-secondary">
                  Increases container outline definition for better visibility on all screens.
                </span>
              </div>
              <input
                type="checkbox"
                checked={preferences.highContrast}
                onChange={(e) =>
                  setPreferences((p) => ({ ...p, highContrast: e.target.checked }))
                }
                className="w-4 h-4 text-brand-primary rounded focus:ring-brand-primary"
              />
            </label>
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
            <span>Save Preferences</span>
          </button>
        </div>
      </form>
    </div>
  );
};
