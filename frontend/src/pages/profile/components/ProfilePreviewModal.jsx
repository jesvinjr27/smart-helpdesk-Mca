import React from 'react';

export const ProfilePreviewModal = ({ isOpen, onClose, profile }) => {
  if (!isOpen || !profile) return null;

  const role = profile.roles?.[0] || 'REQUESTER';
  const roleColors = {
    SYS_ADMIN: 'bg-purple-100 text-purple-800 border-purple-300',
    ORG_ADMIN: 'bg-blue-100 text-blue-800 border-blue-300',
    LEAD: 'bg-teal-100 text-teal-800 border-teal-300',
    AGENT: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    REQUESTER: profile.user_type === 'STUDENT'
      ? 'bg-amber-100 text-amber-800 border-amber-300'
      : 'bg-indigo-100 text-indigo-800 border-indigo-300',
  };

  const roleDisplayNames = {
    SYS_ADMIN: 'Global Administrator',
    ORG_ADMIN: 'Organization Administrator',
    LEAD: 'Support Team Lead',
    AGENT: 'Technical Support Agent',
    REQUESTER: profile.user_type === 'STUDENT' ? 'Student Requester' : 'Corporate Employee',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-app-background w-full max-w-lg rounded-2xl shadow-2xl border border-brand-primary/20 overflow-hidden transform transition-all">
        {/* Top Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-brand-primary/10">
          <div className="flex items-center gap-2">
            <i className="bi bi-person-badge text-brand-primary text-lg" />
            <h3 className="font-bold text-base text-brand-primary">Public Profile Preview</h3>
          </div>
          <button
            onClick={onClose}
            className="text-brand-secondary hover:text-brand-primary p-1 rounded-lg hover:bg-brand-secondary/15 transition-colors"
          >
            <i className="bi bi-x-lg text-sm" />
          </button>
        </div>

        {/* Badge Card */}
        <div className="p-6">
          <div className="card-glow rounded-2xl p-6 relative overflow-hidden bg-white/70 border border-brand-primary/15">
            {/* Top decorative stripe */}
            <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-brand-primary via-brand-secondary to-brand-accent" />

            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 pt-2">
              {/* Avatar */}
              <div className="w-20 h-20 rounded-2xl bg-brand-primary text-white flex items-center justify-center text-2xl font-bold overflow-hidden shadow-subtle flex-shrink-0 border-2 border-white">
                {profile.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={profile.full_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  profile.full_name?.[0]?.toUpperCase() || 'U'
                )}
              </div>

              {/* Name & Primary Role */}
              <div className="text-center sm:text-left flex-1 min-w-0">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <h4 className="text-xl font-bold text-brand-primary tracking-tight truncate">
                    {profile.full_name}
                  </h4>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                      roleColors[role] || roleColors.REQUESTER
                    }`}
                  >
                    {roleDisplayNames[role] || role}
                  </span>
                </div>

                <p className="text-xs font-medium text-brand-secondary mt-0.5">
                  {profile.job_title || 'Help Desk Member'}
                </p>

                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mt-3 text-xs text-brand-primary/80">
                  <span className="flex items-center gap-1.5">
                    <i className="bi bi-building text-brand-secondary" />
                    <span>{profile.org_name || 'Organization'}</span>
                  </span>
                  {profile.department_name && (
                    <span className="flex items-center gap-1.5">
                      <i className="bi bi-diagram-3 text-brand-secondary" />
                      <span>{profile.department_name}</span>
                    </span>
                  )}
                  {profile.location && (
                    <span className="flex items-center gap-1.5">
                      <i className="bi bi-geo-alt text-brand-secondary" />
                      <span>{profile.location}</span>
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Bio */}
            {profile.bio && (
              <div className="mt-5 pt-4 border-t border-brand-primary/10">
                <p className="text-xs text-brand-primary/80 leading-relaxed italic">
                  "{profile.bio}"
                </p>
              </div>
            )}

            {/* Role-Specific Highlights */}
            <div className="mt-4 pt-4 border-t border-brand-primary/10 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {profile.external_id && (
                <div className="bg-brand-secondary/10 p-2.5 rounded-xl">
                  <span className="text-[10px] font-semibold text-brand-secondary uppercase tracking-wider block">
                    {profile.user_type === 'STUDENT' ? 'Student ID' : 'Employee ID'}
                  </span>
                  <span className="font-mono font-bold text-brand-primary">{profile.external_id}</span>
                </div>
              )}

              {profile.course && (
                <div className="bg-brand-secondary/10 p-2.5 rounded-xl">
                  <span className="text-[10px] font-semibold text-brand-secondary uppercase tracking-wider block">
                    Academic Course
                  </span>
                  <span className="font-medium text-brand-primary truncate block">{profile.course}</span>
                </div>
              )}

              {profile.reporting_manager && (
                <div className="bg-brand-secondary/10 p-2.5 rounded-xl">
                  <span className="text-[10px] font-semibold text-brand-secondary uppercase tracking-wider block">
                    Reporting Manager
                  </span>
                  <span className="font-medium text-brand-primary truncate block">{profile.reporting_manager}</span>
                </div>
              )}

              {profile.skills && profile.skills.length > 0 && (
                <div className="bg-brand-secondary/10 p-2.5 rounded-xl sm:col-span-2">
                  <span className="text-[10px] font-semibold text-brand-secondary uppercase tracking-wider block mb-1.5">
                    Verified Expertise & Skills
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {profile.skills.map((skill, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-white text-brand-primary border border-brand-secondary/30"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Card Footer */}
            <div className="mt-4 pt-3 border-t border-brand-primary/10 flex items-center justify-between text-[11px] text-brand-secondary">
              <span className="flex items-center gap-1">
                <i className="bi bi-shield-check text-emerald-600" />
                <span>Enterprise Verified Account</span>
              </span>
              <span>Timezone: {profile.timezone || 'UTC'}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-brand-primary/10 flex justify-end bg-brand-secondary/5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-white bg-brand-primary hover:bg-brand-primary/90 rounded-lg shadow-sm transition-all"
          >
            Close Preview
          </button>
        </div>
      </div>
    </div>
  );
};
