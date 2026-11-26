import React, { useState, useEffect } from 'react';
import { getMyNotificationsApi, updateMyNotificationsApi } from '../../../api';
import { useToast } from '../../../context/ToastContext';

export const NotificationTab = ({ profile, onProfileUpdated }) => {
  const { showSuccess, showError } = useToast();

  const defaultNotifications = {
    in_app: {
      ticket_created: true,
      ticket_assigned: true,
      ticket_status_changed: true,
      ticket_commented: true,
      ticket_resolved: true,
      ticket_reopened: true,
      sla_warning: true,
      sla_breach: true,
      approval_required: true,
      approval_completed: true,
      kb_updates: false,
    },
    email: {
      ticket_created: true,
      ticket_assigned: true,
      ticket_status_changed: true,
      ticket_commented: false,
      ticket_resolved: true,
      ticket_reopened: true,
      sla_warning: true,
      sla_breach: true,
      approval_required: true,
      approval_completed: false,
      kb_updates: false,
    },
  };

  const [preferences, setPreferences] = useState(defaultNotifications);
  const [initialPreferences, setInitialPreferences] = useState(defaultNotifications);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchNotificationPreferences();
  }, []);

  const fetchNotificationPreferences = async () => {
    setLoading(true);
    try {
      const res = await getMyNotificationsApi();
      if (res.data && res.data.in_app && res.data.email) {
        setPreferences(res.data);
        setInitialPreferences(res.data);
      }
    } catch (err) {
      // Use defaults
    } finally {
      setLoading(false);
    }
  };

  const isDirty = JSON.stringify(preferences) !== JSON.stringify(initialPreferences);

  const handleToggle = (channel, eventKey) => {
    setPreferences((prev) => ({
      ...prev,
      [channel]: {
        ...prev[channel],
        [eventKey]: !prev[channel][eventKey],
      },
    }));
  };

  const handleToggleAll = (channel, enable) => {
    setPreferences((prev) => {
      const updatedChannel = {};
      Object.keys(prev[channel]).forEach((key) => {
        updatedChannel[key] = enable;
      });
      return { ...prev, [channel]: updatedChannel };
    });
  };

  const handleResetDefaults = () => {
    setPreferences(defaultNotifications);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await updateMyNotificationsApi({ preferences });
      showSuccess('Notification preferences saved successfully!');
      setInitialPreferences(preferences);
      if (onProfileUpdated && profile) {
        onProfileUpdated({ ...profile, notification_preferences: res.data });
      }
    } catch (err) {
      showError(err.response?.data?.detail || 'Failed to save notification preferences.');
    } finally {
      setSaving(false);
    }
  };

  const notificationEvents = [
    {
      key: 'ticket_created',
      title: 'Ticket Created',
      desc: 'Notifications when a new ticket is submitted in your department or assigned to you.',
      icon: 'bi-ticket-detailed',
    },
    {
      key: 'ticket_assigned',
      title: 'Ticket Assigned / Delegated',
      desc: 'Alerts when an incident is assigned directly to you or your tier team.',
      icon: 'bi-person-check',
    },
    {
      key: 'ticket_status_changed',
      title: 'Status State Machine Change',
      desc: 'Updates when a ticket transitions between New, In Progress, Pending, or Resolved.',
      icon: 'bi-arrow-left-right',
    },
    {
      key: 'ticket_commented',
      title: 'Ticket Comments & Discussions',
      desc: 'New public replies or internal collaboration notes on your tickets.',
      icon: 'bi-chat-dots',
    },
    {
      key: 'ticket_resolved',
      title: 'Ticket Resolved',
      desc: 'Confirmation when an issue is successfully marked resolved with solution notes.',
      icon: 'bi-check2-circle',
    },
    {
      key: 'ticket_reopened',
      title: 'Ticket Reopened',
      desc: 'Immediate alert when a closed or resolved ticket is reopened by the requester.',
      icon: 'bi-arrow-counterclockwise',
    },
    {
      key: 'sla_warning',
      title: 'SLA Approach Warning',
      desc: 'Predictive warning when response or resolution time approaches 75% threshold.',
      icon: 'bi-exclamation-triangle',
    },
    {
      key: 'sla_breach',
      title: 'SLA Policy Breach Escalation',
      desc: 'High-priority alert triggered immediately upon deterministic policy breach.',
      icon: 'bi-alarm-fill',
    },
    {
      key: 'approval_required',
      title: 'Administrative Approval Required',
      desc: 'Prompts requiring approval for hardware changes, privileges, or budget items.',
      icon: 'bi-shield-check',
    },
    {
      key: 'kb_updates',
      title: 'Knowledge Base & Guide Releases',
      desc: 'Alerts when verified self-service documentation or policies are updated.',
      icon: 'bi-journal-bookmark',
    },
  ];

  return (
    <div className="space-y-6">
      <form onSubmit={handleSave} className="space-y-6">
        <div className="card-glow rounded-2xl p-5 sm:p-6 bg-white/70 border border-brand-primary/10 space-y-5">
          {/* Header */}
          <div className="border-b border-brand-primary/10 pb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-base text-brand-primary flex items-center gap-2">
                <i className="bi bi-bell-fill text-brand-secondary" />
                <span>Notification Preferences Matrix</span>
              </h3>
              <p className="text-xs text-brand-secondary mt-0.5">
                Configure real-time in-app bell notifications and email delivery channels.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleResetDefaults}
                className="px-3 py-1.5 text-xs text-brand-secondary hover:text-brand-primary hover:bg-brand-secondary/15 rounded-lg transition-colors"
              >
                Reset to Default
              </button>
            </div>
          </div>

          {/* Table Matrix */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-brand-primary/15 text-brand-primary">
                  <th className="pb-3 font-semibold uppercase tracking-wider text-[11px]">
                    Notification Event
                  </th>
                  <th className="pb-3 text-center font-semibold uppercase tracking-wider text-[11px] w-28 sm:w-36">
                    <div className="flex flex-col items-center">
                      <span className="flex items-center gap-1">
                        <i className="bi bi-bell text-brand-secondary" />
                        <span>In-App</span>
                      </span>
                      <div className="flex gap-1.5 mt-1 text-[9px] font-normal">
                        <button
                          type="button"
                          onClick={() => handleToggleAll('in_app', true)}
                          className="hover:underline text-brand-primary"
                        >
                          All
                        </button>
                        <span>|</span>
                        <button
                          type="button"
                          onClick={() => handleToggleAll('in_app', false)}
                          className="hover:underline text-brand-secondary"
                        >
                          None
                        </button>
                      </div>
                    </div>
                  </th>
                  <th className="pb-3 text-center font-semibold uppercase tracking-wider text-[11px] w-28 sm:w-36">
                    <div className="flex flex-col items-center">
                      <span className="flex items-center gap-1">
                        <i className="bi bi-envelope text-brand-secondary" />
                        <span>Email</span>
                      </span>
                      <div className="flex gap-1.5 mt-1 text-[9px] font-normal">
                        <button
                          type="button"
                          onClick={() => handleToggleAll('email', true)}
                          className="hover:underline text-brand-primary"
                        >
                          All
                        </button>
                        <span>|</span>
                        <button
                          type="button"
                          onClick={() => handleToggleAll('email', false)}
                          className="hover:underline text-brand-secondary"
                        >
                          None
                        </button>
                      </div>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-primary/10">
                {notificationEvents.map((item) => (
                  <tr key={item.key} className="hover:bg-brand-secondary/5 transition-colors">
                    <td className="py-3.5 pr-4">
                      <div className="flex items-start gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-brand-primary/10 text-brand-primary flex items-center justify-center text-xs mt-0.5 flex-shrink-0">
                          <i className={`bi ${item.icon}`} />
                        </div>
                        <div>
                          <span className="font-bold text-brand-primary block text-xs">
                            {item.title}
                          </span>
                          <span className="text-[11px] text-brand-secondary leading-relaxed">
                            {item.desc}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* In-App Toggle */}
                    <td className="py-3.5 text-center">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={preferences.in_app?.[item.key] ?? false}
                          onChange={() => handleToggle('in_app', item.key)}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-brand-secondary/30 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand-primary" />
                      </label>
                    </td>

                    {/* Email Toggle */}
                    <td className="py-3.5 text-center">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={preferences.email?.[item.key] ?? false}
                          onChange={() => handleToggle('email', item.key)}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-brand-secondary/30 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand-primary" />
                      </label>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="submit"
            disabled={!isDirty || saving}
            className="px-5 py-2 text-xs font-semibold text-white bg-brand-primary hover:bg-brand-primary/90 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-subtle transition-all flex items-center gap-2"
          >
            {saving && <i className="bi bi-arrow-repeat animate-spin" />}
            <span>Save Notification Preferences</span>
          </button>
        </div>
      </form>
    </div>
  );
};
