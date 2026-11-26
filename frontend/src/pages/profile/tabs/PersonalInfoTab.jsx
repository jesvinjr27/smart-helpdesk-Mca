import React, { useState, useEffect } from 'react';
import { updateMyProfileApi } from '../../../api';
import { useToast } from '../../../context/ToastContext';

export const PersonalInfoTab = ({ profile, onProfileUpdated }) => {
  const { showSuccess, showError } = useToast();

  // Common Fields Form State
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    altPhone: '',
    jobTitle: '',
    location: '',
    timezone: 'UTC',
    preferredLanguage: 'en',
    bio: '',
    skills: [],
    communicationPreference: 'email',
  });

  const [initialData, setInitialData] = useState({});
  const [newSkillInput, setNewSkillInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (profile) {
      const parts = (profile.full_name || '').split(' ');
      const fName = parts[0] || '';
      const lName = parts.slice(1).join(' ') || '';

      const data = {
        firstName: fName,
        lastName: lName,
        phone: profile.phone || '',
        altPhone: profile.alt_phone || '',
        jobTitle: profile.job_title || '',
        location: profile.location || '',
        timezone: profile.timezone || 'UTC',
        preferredLanguage: profile.preferred_language || 'en',
        bio: profile.bio || '',
        skills: Array.isArray(profile.skills) ? profile.skills : [],
        communicationPreference: profile.communication_preference || 'email',
      };
      setFormData(data);
      setInitialData(data);
    }
  }, [profile]);

  const isDirty = JSON.stringify(formData) !== JSON.stringify(initialData);

  const validate = () => {
    const errs = {};
    if (!formData.firstName.trim()) errs.firstName = 'First name is required.';
    if (formData.phone && !/^[+0-9\s\-()]{7,25}$/.test(formData.phone)) {
      errs.phone = 'Please enter a valid phone number.';
    }
    if (formData.altPhone && !/^[+0-9\s\-()]{7,25}$/.test(formData.altPhone)) {
      errs.altPhone = 'Please enter a valid alternative contact number.';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const handleAddSkill = (e) => {
    e.preventDefault();
    const trimmed = newSkillInput.trim();
    if (trimmed && !formData.skills.includes(trimmed)) {
      setFormData((prev) => ({ ...prev, skills: [...prev.skills, trimmed] }));
      setNewSkillInput('');
    }
  };

  const handleRemoveSkill = (skillToRemove) => {
    setFormData((prev) => ({
      ...prev,
      skills: prev.skills.filter((s) => s !== skillToRemove),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const fullName = `${formData.firstName.trim()} ${formData.lastName.trim()}`.trim();
      const payload = {
        full_name: fullName,
        phone: formData.phone,
        alt_phone: formData.altPhone,
        job_title: formData.jobTitle,
        location: formData.location,
        timezone: formData.timezone,
        preferred_language: formData.preferredLanguage,
        bio: formData.bio,
        skills: formData.skills,
        communication_preference: formData.communicationPreference,
      };

      const res = await updateMyProfileApi(payload);
      showSuccess('Profile information saved successfully!');
      onProfileUpdated(res.data);
      setInitialData(formData);
    } catch (err) {
      showError(err.response?.data?.detail || 'Failed to update profile information.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFormData(initialData);
    setErrors({});
  };

  const role = profile?.roles?.[0] || 'REQUESTER';
  const isStudent = profile?.user_type === 'STUDENT';
  const isAgent = role === 'AGENT';
  const isLead = role === 'LEAD';
  const isOrgAdmin = role === 'ORG_ADMIN';
  const isSysAdmin = role === 'SYS_ADMIN';
  const isEmployee = role === 'REQUESTER' && !isStudent;

  return (
    <div className="space-y-6">
      {/* Unsaved Changes Banner */}
      {isDirty && (
        <div className="sticky top-20 z-20 flex items-center justify-between p-3.5 bg-amber-500/15 border border-amber-500/40 rounded-xl text-amber-900 shadow-sm backdrop-blur-md">
          <div className="flex items-center gap-2.5 text-xs font-medium">
            <i className="bi bi-exclamation-triangle-fill text-amber-600 text-sm" />
            <span>You have unsaved changes in your personal information.</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleReset}
              className="px-2.5 py-1 text-xs text-amber-900 hover:bg-amber-500/20 rounded-md transition-colors"
            >
              Discard
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="px-3 py-1 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-md transition-all shadow-xs flex items-center gap-1.5"
            >
              {loading && <i className="bi bi-arrow-repeat animate-spin" />}
              <span>Save Changes</span>
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Card 1: Common Personal Information */}
        <div className="card-glow rounded-2xl p-5 sm:p-6 bg-white/70 border border-brand-primary/10 space-y-5">
          <div className="border-b border-brand-primary/10 pb-3 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-base text-brand-primary flex items-center gap-2">
                <i className="bi bi-person-lines-fill text-brand-secondary" />
                <span>Personal Information</span>
              </h3>
              <p className="text-xs text-brand-secondary mt-0.5">
                Update your identity details, contact numbers, and professional background.
              </p>
            </div>
            <span className="text-[11px] font-semibold text-brand-secondary bg-brand-secondary/10 px-2.5 py-1 rounded-full border border-brand-secondary/20">
              Editable by You
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* First Name */}
            <div>
              <label className="block text-xs font-semibold text-brand-primary mb-1">
                First Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                placeholder="First name"
                className={`w-full px-3.5 py-2 text-sm rounded-xl border bg-white text-brand-primary placeholder:text-brand-secondary/60 focus:outline-none transition-all ${
                  errors.firstName
                    ? 'border-rose-400 ring-2 ring-rose-200'
                    : 'border-brand-primary/20 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/15'
                }`}
              />
              {errors.firstName && (
                <p className="text-[11px] text-rose-500 mt-1">{errors.firstName}</p>
              )}
            </div>

            {/* Last Name */}
            <div>
              <label className="block text-xs font-semibold text-brand-primary mb-1">
                Last Name
              </label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                placeholder="Last name"
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-brand-primary/20 bg-white text-brand-primary placeholder:text-brand-secondary/60 focus:outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/15 transition-all"
              />
            </div>

            {/* Display Name Preview */}
            <div className="sm:col-span-2 bg-brand-secondary/5 rounded-xl p-3 border border-brand-secondary/20 flex items-center justify-between text-xs">
              <span className="text-brand-secondary">Full Display Name:</span>
              <span className="font-bold text-brand-primary">
                {`${formData.firstName} ${formData.lastName}`.trim() || '—'}
              </span>
            </div>

            {/* Email Address (Read-only) */}
            <div>
              <label className="block text-xs font-semibold text-brand-primary mb-1">
                Email Address <span className="text-[10px] text-brand-secondary">(Primary Account)</span>
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={profile?.email || ''}
                  disabled
                  className="w-full pl-9 pr-3.5 py-2 text-sm rounded-xl border border-brand-primary/15 bg-brand-secondary/10 text-brand-primary/70 cursor-not-allowed"
                />
                <i className="bi bi-envelope absolute left-3 top-2.5 text-brand-secondary text-sm" />
              </div>
              <p className="text-[10px] text-brand-secondary mt-1">
                To update email, visit the <strong className="text-brand-primary">Account Settings</strong> tab.
              </p>
            </div>

            {/* Mobile Number */}
            <div>
              <label className="block text-xs font-semibold text-brand-primary mb-1">
                Mobile Number
              </label>
              <div className="relative">
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+1 (555) 000-0000"
                  className={`w-full pl-9 pr-3.5 py-2 text-sm rounded-xl border bg-white text-brand-primary placeholder:text-brand-secondary/60 focus:outline-none transition-all ${
                    errors.phone
                      ? 'border-rose-400 ring-2 ring-rose-200'
                      : 'border-brand-primary/20 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/15'
                  }`}
                />
                <i className="bi bi-telephone absolute left-3 top-2.5 text-brand-secondary text-sm" />
              </div>
              {errors.phone && <p className="text-[11px] text-rose-500 mt-1">{errors.phone}</p>}
            </div>

            {/* Alternative Contact Number */}
            <div>
              <label className="block text-xs font-semibold text-brand-primary mb-1">
                Alternative Contact Number
              </label>
              <div className="relative">
                <input
                  type="tel"
                  name="altPhone"
                  value={formData.altPhone}
                  onChange={handleChange}
                  placeholder="Secondary phone or extension"
                  className={`w-full pl-9 pr-3.5 py-2 text-sm rounded-xl border bg-white text-brand-primary placeholder:text-brand-secondary/60 focus:outline-none transition-all ${
                    errors.altPhone
                      ? 'border-rose-400 ring-2 ring-rose-200'
                      : 'border-brand-primary/20 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/15'
                  }`}
                />
                <i className="bi bi-phone absolute left-3 top-2.5 text-brand-secondary text-sm" />
              </div>
              {errors.altPhone && <p className="text-[11px] text-rose-500 mt-1">{errors.altPhone}</p>}
            </div>

            {/* Job Title / Designation */}
            <div>
              <label className="block text-xs font-semibold text-brand-primary mb-1">
                Job Title / Designation
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="jobTitle"
                  value={formData.jobTitle}
                  onChange={handleChange}
                  placeholder="e.g. Senior Analyst / Student"
                  className="w-full pl-9 pr-3.5 py-2 text-sm rounded-xl border border-brand-primary/20 bg-white text-brand-primary placeholder:text-brand-secondary/60 focus:outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/15 transition-all"
                />
                <i className="bi bi-briefcase absolute left-3 top-2.5 text-brand-secondary text-sm" />
              </div>
            </div>

            {/* Location */}
            <div>
              <label className="block text-xs font-semibold text-brand-primary mb-1">
                Office / Campus Location
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="e.g. Building A, Floor 3 / North Hall"
                  className="w-full pl-9 pr-3.5 py-2 text-sm rounded-xl border border-brand-primary/20 bg-white text-brand-primary placeholder:text-brand-secondary/60 focus:outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/15 transition-all"
                />
                <i className="bi bi-geo-alt absolute left-3 top-2.5 text-brand-secondary text-sm" />
              </div>
            </div>

            {/* Preferred Language */}
            <div>
              <label className="block text-xs font-semibold text-brand-primary mb-1">
                Preferred Language
              </label>
              <select
                name="preferredLanguage"
                value={formData.preferredLanguage}
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
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-brand-primary mb-1">
                Time Zone
              </label>
              <select
                name="timezone"
                value={formData.timezone}
                onChange={handleChange}
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-brand-primary/20 bg-white text-brand-primary focus:outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/15 transition-all"
              >
                <option value="UTC">UTC (Coordinated Universal Time)</option>
                <option value="America/New_York">America/New_York (Eastern Time, UTC-5)</option>
                <option value="America/Chicago">America/Chicago (Central Time, UTC-6)</option>
                <option value="America/Denver">America/Denver (Mountain Time, UTC-7)</option>
                <option value="America/Los_Angeles">America/Los_Angeles (Pacific Time, UTC-8)</option>
                <option value="Europe/London">Europe/London (GMT/BST, UTC+0/+1)</option>
                <option value="Europe/Paris">Europe/Paris (CET, UTC+1)</option>
                <option value="Asia/Kolkata">Asia/Kolkata (IST, UTC+5:30)</option>
                <option value="Asia/Singapore">Asia/Singapore (SGT, UTC+8)</option>
                <option value="Asia/Tokyo">Asia/Tokyo (JST, UTC+9)</option>
              </select>
            </div>

            {/* About Me / Short Bio */}
            <div className="sm:col-span-2">
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-brand-primary">
                  About Me / Short Bio
                </label>
                <span className="text-[10px] text-brand-secondary">
                  {formData.bio.length}/300 characters
                </span>
              </div>
              <textarea
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                maxLength={300}
                rows={3}
                placeholder="Brief summary of your responsibilities, team function, or campus department..."
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-brand-primary/20 bg-white text-brand-primary placeholder:text-brand-secondary/60 focus:outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/15 transition-all resize-none"
              />
            </div>
          </div>
        </div>

        {/* Card 2: Role-Specific Profile Information */}
        <div className="card-glow rounded-2xl p-5 sm:p-6 bg-white/70 border border-brand-primary/10 space-y-4">
          <div className="border-b border-brand-primary/10 pb-3 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-base text-brand-primary flex items-center gap-2">
                <i className="bi bi-shield-lock text-brand-secondary" />
                <span>
                  {isSysAdmin && 'Platform Administrator Profile'}
                  {isOrgAdmin && 'Organization Administrator Profile'}
                  {isLead && 'Support Team Lead Profile'}
                  {isAgent && 'Support Agent & Technical Expertise'}
                  {isStudent && 'Student Academic Profile'}
                  {isEmployee && 'Enterprise Employee Profile'}
                </span>
              </h3>
              <p className="text-xs text-brand-secondary mt-0.5">
                Role-authorized profile scope and organizational alignment.
              </p>
            </div>
            <span className="text-[11px] font-semibold text-brand-primary bg-brand-accent/25 px-2.5 py-1 rounded-full border border-brand-secondary/30">
              Role: {role}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Global Admin Details */}
            {isSysAdmin && (
              <>
                <div className="bg-brand-secondary/5 p-3.5 rounded-xl border border-brand-primary/10">
                  <span className="text-[10px] font-semibold text-brand-secondary uppercase tracking-wider block">
                    Platform Scope
                  </span>
                  <span className="font-bold text-sm text-brand-primary block mt-0.5">
                    Full Cross-Tenant Governance
                  </span>
                  <p className="text-[11px] text-brand-secondary mt-1">
                    Multi-tenant workspace configuration, Argon2id security policy, local AI/RAG indexing.
                  </p>
                </div>
                <div className="bg-brand-secondary/5 p-3.5 rounded-xl border border-brand-primary/10">
                  <span className="text-[10px] font-semibold text-brand-secondary uppercase tracking-wider block">
                    Account Status
                  </span>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="font-bold text-xs text-emerald-800 uppercase">
                      Active Global Root Administrator
                    </span>
                  </div>
                </div>
              </>
            )}

            {/* Organization Admin Details */}
            {isOrgAdmin && (
              <>
                <div className="bg-brand-secondary/5 p-3.5 rounded-xl border border-brand-primary/10">
                  <span className="text-[10px] font-semibold text-brand-secondary uppercase tracking-wider block">
                    Assigned Organization
                  </span>
                  <span className="font-bold text-sm text-brand-primary block mt-0.5">
                    {profile?.org_name || 'Organization'}
                  </span>
                  <span className="text-[10px] text-brand-secondary font-mono mt-0.5 block">
                    Org ID: {profile?.org_id}
                  </span>
                </div>
                <div className="bg-brand-secondary/5 p-3.5 rounded-xl border border-brand-primary/10">
                  <span className="text-[10px] font-semibold text-brand-secondary uppercase tracking-wider block">
                    Department Scope
                  </span>
                  <span className="font-bold text-sm text-brand-primary block mt-0.5">
                    {profile?.department_name || 'All Departments'}
                  </span>
                  <span className="text-[11px] text-brand-secondary mt-0.5 block">
                    Authorized to govern categories, SLA policies, and team routing.
                  </span>
                </div>
              </>
            )}

            {/* Team Lead Details */}
            {isLead && (
              <>
                <div className="bg-brand-secondary/5 p-3.5 rounded-xl border border-brand-primary/10">
                  <span className="text-[10px] font-semibold text-brand-secondary uppercase tracking-wider block">
                    Organization & Department
                  </span>
                  <span className="font-bold text-sm text-brand-primary block mt-0.5">
                    {profile?.org_name} • {profile?.department_name || 'Support'}
                  </span>
                </div>
                <div className="bg-brand-secondary/5 p-3.5 rounded-xl border border-brand-primary/10">
                  <span className="text-[10px] font-semibold text-brand-secondary uppercase tracking-wider block mb-1">
                    Assigned Teams (Read-Only)
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {profile?.teams?.length ? (
                      profile.teams.map((t, idx) => (
                        <span
                          key={idx}
                          className="px-2.5 py-0.5 rounded-md text-xs font-semibold bg-brand-primary text-white"
                        >
                          {t}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-brand-secondary">Tier-1 Support Team</span>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* Support Agent Skills & Teams */}
            {isAgent && (
              <>
                <div className="bg-brand-secondary/5 p-3.5 rounded-xl border border-brand-primary/10">
                  <span className="text-[10px] font-semibold text-brand-secondary uppercase tracking-wider block mb-1">
                    Assigned Support Teams (Read-Only)
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {profile?.teams?.length ? (
                      profile.teams.map((t, idx) => (
                        <span
                          key={idx}
                          className="px-2.5 py-0.5 rounded-md text-xs font-semibold bg-brand-secondary text-brand-primary border border-brand-secondary/30"
                        >
                          {t}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-brand-secondary">Primary Support Queue</span>
                    )}
                  </div>
                </div>

                {/* Technical Skills & Expertise Tag Editor */}
                <div className="sm:col-span-2 bg-brand-secondary/5 p-3.5 rounded-xl border border-brand-primary/10">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-brand-primary flex items-center gap-1.5">
                      <i className="bi bi-tools text-brand-secondary" />
                      <span>Technical Skills & Areas of Expertise</span>
                    </span>
                    <span className="text-[10px] text-brand-secondary">
                      Used by automatic ticket routing algorithms
                    </span>
                  </div>

                  {/* Add skill input */}
                  <div className="flex items-center gap-2 mb-3">
                    <input
                      type="text"
                      value={newSkillInput}
                      onChange={(e) => setNewSkillInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddSkill(e)}
                      placeholder="Add a skill (e.g. Active Directory, Docker, Hardware Diagnostics)..."
                      className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-brand-primary/20 bg-white text-brand-primary focus:outline-none focus:border-brand-primary"
                    />
                    <button
                      type="button"
                      onClick={handleAddSkill}
                      className="px-3 py-1.5 text-xs font-semibold text-white bg-brand-primary hover:bg-brand-primary/90 rounded-lg transition-all"
                    >
                      Add Skill
                    </button>
                  </div>

                  {/* Skill tags */}
                  <div className="flex flex-wrap gap-1.5">
                    {formData.skills.map((skill, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-white border border-brand-secondary/40 text-brand-primary shadow-xs"
                      >
                        <span>{skill}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveSkill(skill)}
                          className="text-brand-secondary hover:text-rose-600 focus:outline-none"
                        >
                          <i className="bi bi-x text-xs" />
                        </button>
                      </span>
                    ))}
                    {formData.skills.length === 0 && (
                      <span className="text-xs text-brand-secondary italic">
                        No technical skills listed yet. Add skills to receive relevant ticket assignments.
                      </span>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* Student Profile Card */}
            {isStudent && (
              <>
                <div className="bg-brand-secondary/5 p-3.5 rounded-xl border border-brand-primary/10">
                  <span className="text-[10px] font-semibold text-brand-secondary uppercase tracking-wider block">
                    Student ID (Read-Only)
                  </span>
                  <span className="font-mono font-bold text-sm text-brand-primary block mt-0.5">
                    {profile?.external_id || 'STU-2024-0891'}
                  </span>
                  <span className="text-[10px] text-brand-secondary mt-0.5 block">
                    Institution: {profile?.org_name || 'Greenwood Institute of Technology'}
                  </span>
                </div>

                <div className="bg-brand-secondary/5 p-3.5 rounded-xl border border-brand-primary/10">
                  <span className="text-[10px] font-semibold text-brand-secondary uppercase tracking-wider block">
                    Course & Academic Year
                  </span>
                  <span className="font-bold text-sm text-brand-primary block mt-0.5">
                    {profile?.course || 'B.Tech Computer Science'}
                  </span>
                  <span className="text-xs text-brand-secondary block mt-0.5">
                    {profile?.academic_year || '3rd Year (Class of 2026)'}
                  </span>
                </div>
              </>
            )}

            {/* Corporate Employee Profile Card */}
            {isEmployee && (
              <>
                <div className="bg-brand-secondary/5 p-3.5 rounded-xl border border-brand-primary/10">
                  <span className="text-[10px] font-semibold text-brand-secondary uppercase tracking-wider block">
                    Employee ID (Read-Only)
                  </span>
                  <span className="font-mono font-bold text-sm text-brand-primary block mt-0.5">
                    {profile?.external_id || 'EMP-4102'}
                  </span>
                  <span className="text-[10px] text-brand-secondary mt-0.5 block">
                    Company: {profile?.org_name || 'Apex Enterprises'}
                  </span>
                </div>

                <div className="bg-brand-secondary/5 p-3.5 rounded-xl border border-brand-primary/10">
                  <span className="text-[10px] font-semibold text-brand-secondary uppercase tracking-wider block">
                    Reporting Manager
                  </span>
                  <span className="font-bold text-sm text-brand-primary block mt-0.5">
                    {profile?.reporting_manager || 'Executive Operations Lead'}
                  </span>
                  <span className="text-xs text-brand-secondary block mt-0.5">
                    Department: {profile?.department_name || 'Finance & Accounting'}
                  </span>
                </div>
              </>
            )}

            {/* Preferred Communication Method */}
            <div className="sm:col-span-2 bg-brand-secondary/5 p-3.5 rounded-xl border border-brand-primary/10">
              <label className="block text-xs font-semibold text-brand-primary mb-1">
                Preferred Help Desk Communication Method
              </label>
              <div className="flex flex-wrap gap-4 mt-1.5">
                <label className="flex items-center gap-2 text-xs font-medium text-brand-primary cursor-pointer">
                  <input
                    type="radio"
                    name="communicationPreference"
                    value="email"
                    checked={formData.communicationPreference === 'email'}
                    onChange={handleChange}
                    className="text-brand-primary focus:ring-brand-primary"
                  />
                  <span>Email Notifications (Standard Delivery)</span>
                </label>

                <label className="flex items-center gap-2 text-xs font-medium text-brand-primary cursor-pointer">
                  <input
                    type="radio"
                    name="communicationPreference"
                    value="in_app"
                    checked={formData.communicationPreference === 'in_app'}
                    onChange={handleChange}
                    className="text-brand-primary focus:ring-brand-primary"
                  />
                  <span>In-App Real-time Bell Notifications</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={handleReset}
            disabled={!isDirty || loading}
            className="px-4 py-2 text-xs font-semibold text-brand-secondary hover:text-brand-primary disabled:opacity-40 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!isDirty || loading}
            className="px-5 py-2 text-xs font-semibold text-white bg-brand-primary hover:bg-brand-primary/90 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-subtle transition-all flex items-center gap-2"
          >
            {loading && <i className="bi bi-arrow-repeat animate-spin" />}
            <span>Save Profile Changes</span>
          </button>
        </div>
      </form>
    </div>
  );
};
