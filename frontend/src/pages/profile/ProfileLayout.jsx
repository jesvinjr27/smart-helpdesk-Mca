import React, { useState, useEffect } from 'react';
import { NavLink, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { getMyProfileApi } from '../../api';
import { PersonalInfoTab } from './tabs/PersonalInfoTab';
import { AccountSettingsTab } from './tabs/AccountSettingsTab';
import { SecurityTab } from './tabs/SecurityTab';
import { NotificationTab } from './tabs/NotificationTab';
import { PreferencesTab } from './tabs/PreferencesTab';
import { ActivityTab } from './tabs/ActivityTab';
import { AvatarUploadModal } from './components/AvatarUploadModal';
import { ProfilePreviewModal } from './components/ProfilePreviewModal';

export const ProfileLayout = () => {
  const { user: authUser, setUser } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [avatarModalOpen, setAvatarModalOpen] = useState(false);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await getMyProfileApi();
      setProfile(res.data);
      if (setUser) {
        setUser((prev) => ({ ...prev, ...res.data }));
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdated = (updatedProfile) => {
    setProfile(updatedProfile);
    if (setUser) {
      setUser((prev) => ({ ...prev, ...updatedProfile }));
    }
  };

  const handleAvatarUpdated = (newAvatarUrl) => {
    setProfile((prev) => ({ ...prev, avatar_url: newAvatarUrl }));
    if (setUser) {
      setUser((prev) => ({ ...prev, avatar_url: newAvatarUrl }));
    }
  };

  // Determine active tab from URL path
  const currentPath = location.pathname;
  let activeTab = 'personal-information';
  if (currentPath.includes('/profile/account')) activeTab = 'account';
  else if (currentPath.includes('/profile/security')) activeTab = 'security';
  else if (currentPath.includes('/profile/notifications')) activeTab = 'notifications';
  else if (currentPath.includes('/profile/preferences')) activeTab = 'preferences';
  else if (currentPath.includes('/profile/activity')) activeTab = 'activity';

  const role = profile?.roles?.[0] || 'REQUESTER';
  const roleStyles = {
    SYS_ADMIN: {
      bg: 'bg-purple-100 text-purple-900 border-purple-300',
      title: 'Global Administrator',
      icon: 'bi-globe2',
    },
    ORG_ADMIN: {
      bg: 'bg-blue-100 text-blue-900 border-blue-300',
      title: 'Organization Administrator',
      icon: 'bi-building-gear',
    },
    LEAD: {
      bg: 'bg-teal-100 text-teal-900 border-teal-300',
      title: 'Support Team Lead',
      icon: 'bi-people-fill',
    },
    AGENT: {
      bg: 'bg-emerald-100 text-emerald-900 border-emerald-300',
      title: 'Support Agent',
      icon: 'bi-headset',
    },
    REQUESTER: profile?.user_type === 'STUDENT'
      ? { bg: 'bg-amber-100 text-amber-900 border-amber-300', title: 'Student Requester', icon: 'bi-mortarboard' }
      : { bg: 'bg-indigo-100 text-indigo-900 border-indigo-300', title: 'Corporate Employee', icon: 'bi-briefcase' },
  };

  const currentRoleStyle = roleStyles[role] || roleStyles.REQUESTER;

  const tabs = [
    {
      id: 'personal-information',
      path: '/profile/personal-information',
      label: 'Personal Information',
      icon: 'bi-person-badge',
    },
    {
      id: 'account',
      path: '/profile/account',
      label: 'Account Settings',
      icon: 'bi-gear-wide-connected',
    },
    {
      id: 'security',
      path: '/profile/security',
      label: 'Security & Sessions',
      icon: 'bi-shield-check',
    },
    {
      id: 'notifications',
      path: '/profile/notifications',
      label: 'Notification Matrix',
      icon: 'bi-bell',
    },
    {
      id: 'preferences',
      path: '/profile/preferences',
      label: 'Preferences',
      icon: 'bi-sliders2',
    },
    {
      id: 'activity',
      path: '/profile/activity',
      label: 'My Activity',
      icon: 'bi-clock-history',
    },
  ];

  if (loading && !profile) {
    return (
      <div className="py-16 flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 border-4 border-brand-secondary/30 border-t-brand-primary rounded-full animate-spin" />
        <span className="text-xs font-semibold text-brand-primary">Loading User Profile...</span>
      </div>
    );
  }

  const completion = profile?.profile_completion_percentage || 0;

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12 animate-fadeIn">
      {/* 1. Profile Hero Banner */}
      <div className="card-glow rounded-3xl p-6 sm:p-8 bg-white/80 border border-brand-primary/15 shadow-sm relative overflow-hidden">
        {/* Decorative corner glow */}
        <div className="absolute -top-16 -right-16 w-64 h-64 bg-brand-accent/20 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row items-center lg:items-start justify-between gap-6 relative z-10">
          {/* Avatar and Basic Info */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left">
            {/* Avatar with Camera Trigger */}
            <div className="relative group flex-shrink-0">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-brand-primary text-white flex items-center justify-center text-3xl font-bold overflow-hidden shadow-subtle border-4 border-white">
                {profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={profile.full_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  profile?.full_name?.[0]?.toUpperCase() || 'U'
                )}
              </div>
              <button
                type="button"
                onClick={() => setAvatarModalOpen(true)}
                title="Change Profile Photo"
                className="absolute bottom-1 right-1 w-8 h-8 rounded-xl bg-brand-primary text-white hover:bg-brand-primary/90 flex items-center justify-center shadow-md border-2 border-white transition-transform hover:scale-110 focus:outline-none cursor-pointer"
              >
                <i className="bi bi-camera text-xs" />
              </button>
            </div>

            {/* Identity & Badges */}
            <div className="space-y-1.5 min-w-0">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-brand-primary">
                  {profile?.full_name}
                </h1>
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${currentRoleStyle.bg}`}
                >
                  <i className={`bi ${currentRoleStyle.icon}`} />
                  <span>{currentRoleStyle.title}</span>
                </span>
              </div>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 text-xs text-brand-secondary font-medium">
                <span>{profile?.email}</span>
                <span>•</span>
                <span>{profile?.job_title || 'Help Desk Member'}</span>
              </div>

              {/* Organization & Department Pills */}
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1 text-xs">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-brand-secondary/15 text-brand-primary font-medium border border-brand-secondary/30">
                  <i className="bi bi-building text-xs text-brand-secondary" />
                  <span>{profile?.org_name || 'Organization'}</span>
                </span>
                {profile?.department_name && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-brand-secondary/15 text-brand-primary font-medium border border-brand-secondary/30">
                    <i className="bi bi-diagram-3 text-xs text-brand-secondary" />
                    <span>{profile.department_name}</span>
                  </span>
                )}
                {profile?.external_id && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-brand-primary/10 text-brand-primary font-mono text-[11px] font-bold border border-brand-primary/20">
                    <i className="bi bi-person-vcard text-xs text-brand-secondary" />
                    <span>{profile.external_id}</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Profile Completion & Quick Actions */}
          <div className="flex flex-col sm:flex-row lg:flex-col items-center sm:items-end justify-center gap-4 w-full lg:w-auto">
            {/* Completion Meter */}
            <div className="bg-brand-secondary/10 p-3.5 rounded-2xl border border-brand-secondary/25 w-full sm:w-64 text-left">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-bold text-brand-primary flex items-center gap-1.5">
                  <i className="bi bi-pie-chart text-brand-secondary" />
                  <span>Profile Strength</span>
                </span>
                <span className="font-extrabold text-brand-primary">{completion}%</span>
              </div>
              <div className="w-full h-2 bg-brand-secondary/25 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-brand-secondary to-brand-primary rounded-full transition-all duration-500"
                  style={{ width: `${completion}%` }}
                />
              </div>
              <span className="text-[10px] text-brand-secondary mt-1 block">
                {completion === 100
                  ? 'All recommended profile attributes completed!'
                  : 'Add bio, location, and mobile number to reach 100%'}
              </span>
            </div>

            {/* Preview Profile Button */}
            <button
              type="button"
              onClick={() => setPreviewModalOpen(true)}
              className="px-4 py-2 text-xs font-semibold text-brand-primary bg-white hover:bg-brand-accent/20 rounded-xl border border-brand-primary/20 shadow-xs transition-all flex items-center gap-2"
            >
              <i className="bi bi-eye" />
              <span>Preview Profile Badge</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Main Content Grid: Tabs Navigation + Tab Body */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Column: Vertical Tab Navigation & Account Overview */}
        <div className="lg:col-span-1 space-y-6">
          {/* Navigation Card */}
          <div className="card-glow rounded-2xl p-2.5 bg-white/70 border border-brand-primary/10 space-y-1">
            <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-brand-secondary">
              Settings & Configuration
            </div>
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => navigate(tab.path)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-left transition-all cursor-pointer ${
                    isActive
                      ? 'bg-brand-primary text-white shadow-subtle'
                      : 'text-brand-primary/80 hover:bg-brand-secondary/15 hover:text-brand-primary'
                  }`}
                >
                  <i className={`bi ${tab.icon} text-sm flex-shrink-0`} />
                  <span className="truncate">{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Account Meta Information Card */}
          <div className="card-glow rounded-2xl p-4 sm:p-5 bg-white/70 border border-brand-primary/10 space-y-3 text-xs">
            <div className="flex items-center gap-2 font-bold text-brand-primary border-b border-brand-primary/10 pb-2">
              <i className="bi bi-info-circle text-brand-secondary" />
              <span>Account Information</span>
            </div>

            <div className="space-y-2 text-[11px]">
              <div>
                <span className="text-brand-secondary block">Account ID:</span>
                <span className="font-mono text-brand-primary font-semibold break-all">
                  {profile?.id}
                </span>
              </div>

              <div>
                <span className="text-brand-secondary block">Account Status:</span>
                <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span>{profile?.account_status || 'ACTIVE'}</span>
                </span>
              </div>

              <div>
                <span className="text-brand-secondary block">Member Since:</span>
                <span className="font-semibold text-brand-primary">
                  {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : '—'}
                </span>
              </div>

              <div>
                <span className="text-brand-secondary block">Assigned Workspaces:</span>
                <span className="font-semibold text-brand-primary">
                  {profile?.workspaces?.length || 1} Organization Workspace(s)
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Tab View Content */}
        <div className="lg:col-span-3 min-w-0">
          {activeTab === 'personal-information' && (
            <PersonalInfoTab profile={profile} onProfileUpdated={handleProfileUpdated} />
          )}
          {activeTab === 'account' && (
            <AccountSettingsTab profile={profile} onProfileUpdated={handleProfileUpdated} />
          )}
          {activeTab === 'security' && <SecurityTab />}
          {activeTab === 'notifications' && (
            <NotificationTab profile={profile} onProfileUpdated={handleProfileUpdated} />
          )}
          {activeTab === 'preferences' && (
            <PreferencesTab profile={profile} onProfileUpdated={handleProfileUpdated} />
          )}
          {activeTab === 'activity' && <ActivityTab />}
        </div>
      </div>

      {/* Modals */}
      <AvatarUploadModal
        isOpen={avatarModalOpen}
        onClose={() => setAvatarModalOpen(false)}
        currentAvatarUrl={profile?.avatar_url}
        onAvatarUpdated={handleAvatarUpdated}
      />

      <ProfilePreviewModal
        isOpen={previewModalOpen}
        onClose={() => setPreviewModalOpen(false)}
        profile={profile}
      />
    </div>
  );
};
