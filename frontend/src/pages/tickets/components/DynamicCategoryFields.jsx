import React, { useEffect } from 'react';

const SUBCATEGORIES_MAP = {
  hardware: ['Laptop', 'Workstation / Desktop', 'External Monitor', 'Keyboard / Mouse', 'Printer / Scanner', 'Docking Station', 'Other Device'],
  network: ['Campus Wi-Fi (Eduroam / Staff)', 'Ethernet Cable Connection', 'GlobalProtect / AnyConnect VPN', 'DNS / Firewall Block', 'Slow Speeds / Intermittent Drops'],
  software: ['Microsoft 365 / Teams', 'Operating System Crash / BSOD', 'Licensed Dev Software (VSCode, Docker)', 'Specialized Engineering Software', 'Browser Issue (Chrome / Edge)'],
  access: ['Password Reset / Account Locked', 'Multi-Factor Authentication (2FA/OTP)', 'Role / Permission Elevation', 'VPN Account Activation', 'Shared Folder / Google Drive Access'],
  lms: ['Canvas LMS Course Enrollment', 'Assignment Submission Error', 'Student Portal Login', 'Gradebook Access', 'Online Exam Browser (Respondus)'],
  email: ['Email Delivery / Bounce Notice', 'Outlook Client Sync', 'Spam / Phishing Report', 'Shared Mailbox / Distribution List'],
  general: ['General IT Question', 'Equipment Relocation', 'Policy Clarification', 'Other Request'],
};

export const DynamicCategoryFields = ({ categoryName = '', dynamicData, setDynamicData }) => {
  const lower = categoryName.toLowerCase();

  const getCategoryKey = () => {
    if (lower.includes('hardware') || lower.includes('workstation') || lower.includes('lab')) return 'hardware';
    if (lower.includes('network') || lower.includes('wifi') || lower.includes('wi-fi') || lower.includes('vpn')) return 'network';
    if (lower.includes('software') || lower.includes('app')) return 'software';
    if (lower.includes('access') || lower.includes('identity')) return 'access';
    if (lower.includes('lms') || lower.includes('student') || lower.includes('portal') || lower.includes('library')) return 'lms';
    if (lower.includes('email') || lower.includes('communication')) return 'email';
    return 'general';
  };

  const catKey = getCategoryKey();
  const subcategories = SUBCATEGORIES_MAP[catKey] || SUBCATEGORIES_MAP.general;

  // Initialize subcategory if empty
  useEffect(() => {
    if (!dynamicData.subcategory && subcategories.length > 0) {
      setDynamicData((prev) => ({ ...prev, subcategory: subcategories[0] }));
    }
  }, [catKey]);

  const handleChange = (field, val) => {
    setDynamicData((prev) => ({ ...prev, [field]: val }));
  };

  return (
    <div className="p-4 sm:p-5 rounded-2xl bg-brand-secondary/10 border border-brand-secondary/30 space-y-4">
      <div className="flex items-center gap-2 pb-2.5 border-b border-brand-primary/10">
        <i className="bi bi-sliders text-brand-primary text-base" />
        <h4 className="text-xs sm:text-sm font-bold text-brand-primary uppercase tracking-wider m-0">
          Contextual Details: {categoryName || 'General'}
        </h4>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Subcategory Select */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-brand-primary mb-1.5">
            Subcategory / Area <span className="text-brand-primary font-bold">*</span>
          </label>
          <select
            value={dynamicData.subcategory || subcategories[0]}
            onChange={(e) => handleChange('subcategory', e.target.value)}
            className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-app-background border border-brand-secondary/40 rounded-xl text-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-accent/40 focus:border-brand-primary transition-colors cursor-pointer"
          >
            {subcategories.map((sub) => (
              <option key={sub} value={sub}>
                {sub}
              </option>
            ))}
          </select>
        </div>

        {/* Dynamic Fields Per Category */}
        {catKey === 'hardware' && (
          <>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-brand-primary mb-1.5">
                Operating System
              </label>
              <select
                value={dynamicData.operatingSystem || 'Windows 11'}
                onChange={(e) => handleChange('operatingSystem', e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-app-background border border-brand-secondary/40 rounded-xl text-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-accent/40 focus:border-brand-primary transition-colors cursor-pointer"
              >
                <option value="Windows 11">Windows 11</option>
                <option value="Windows 10">Windows 10</option>
                <option value="macOS (Apple Silicon / Intel)">macOS</option>
                <option value="Ubuntu / Linux">Ubuntu / Linux</option>
                <option value="ChromeOS">ChromeOS</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-brand-primary mb-1.5">
                Asset Tag / Serial Number (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. APEX-LT-2041 or Dell S/N"
                value={dynamicData.assetTag || ''}
                onChange={(e) => handleChange('assetTag', e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-app-background border border-brand-secondary/40 rounded-xl text-brand-primary placeholder:text-brand-secondary/60 focus:outline-none focus:ring-2 focus:ring-brand-accent/40 focus:border-brand-primary transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-brand-primary mb-1.5">
                Device Location / Office
              </label>
              <input
                type="text"
                placeholder="e.g. Room 304, Engineering Lab 2"
                value={dynamicData.location || ''}
                onChange={(e) => handleChange('location', e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-app-background border border-brand-secondary/40 rounded-xl text-brand-primary placeholder:text-brand-secondary/60 focus:outline-none focus:ring-2 focus:ring-brand-accent/40 focus:border-brand-primary transition-colors"
              />
            </div>
          </>
        )}

        {catKey === 'network' && (
          <>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-brand-primary mb-1.5">
                Connection Mode
              </label>
              <select
                value={dynamicData.connectionMode || 'Campus Wi-Fi'}
                onChange={(e) => handleChange('connectionMode', e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-app-background border border-brand-secondary/40 rounded-xl text-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-accent/40 focus:border-brand-primary transition-colors cursor-pointer"
              >
                <option value="Campus Wi-Fi">Campus Wi-Fi</option>
                <option value="Wired Ethernet">Wired Ethernet</option>
                <option value="VPN from Home">VPN from Home</option>
                <option value="Guest Wi-Fi">Guest Wi-Fi</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-brand-primary mb-1.5">
                Campus Location / Building / Room
              </label>
              <input
                type="text"
                placeholder="e.g. Science Block, 3rd Floor"
                value={dynamicData.location || ''}
                onChange={(e) => handleChange('location', e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-app-background border border-brand-secondary/40 rounded-xl text-brand-primary placeholder:text-brand-secondary/60 focus:outline-none focus:ring-2 focus:ring-brand-accent/40 focus:border-brand-primary transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-brand-primary mb-1.5">
                Error Code or Symptom (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Error 403, DNS probe finished, Auth Timeout"
                value={dynamicData.errorDetails || ''}
                onChange={(e) => handleChange('errorDetails', e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-app-background border border-brand-secondary/40 rounded-xl text-brand-primary placeholder:text-brand-secondary/60 focus:outline-none focus:ring-2 focus:ring-brand-accent/40 focus:border-brand-primary transition-colors"
              />
            </div>
          </>
        )}

        {(catKey === 'software' || catKey === 'lms') && (
          <>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-brand-primary mb-1.5">
                Application Name
              </label>
              <input
                type="text"
                placeholder="e.g. Canvas LMS, Microsoft 365, MATLAB"
                value={dynamicData.appName || ''}
                onChange={(e) => handleChange('appName', e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-app-background border border-brand-secondary/40 rounded-xl text-brand-primary placeholder:text-brand-secondary/60 focus:outline-none focus:ring-2 focus:ring-brand-accent/40 focus:border-brand-primary transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-brand-primary mb-1.5">
                Browser / Client Version
              </label>
              <input
                type="text"
                placeholder="e.g. Google Chrome v124, Windows Desktop Client"
                value={dynamicData.appVersion || ''}
                onChange={(e) => handleChange('appVersion', e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-app-background border border-brand-secondary/40 rounded-xl text-brand-primary placeholder:text-brand-secondary/60 focus:outline-none focus:ring-2 focus:ring-brand-accent/40 focus:border-brand-primary transition-colors"
              />
            </div>
          </>
        )}

        {catKey === 'access' && (
          <>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-brand-primary mb-1.5">
                Target System / Portal Name
              </label>
              <input
                type="text"
                placeholder="e.g. Active Directory, SAP, GitHub, Student ERP"
                value={dynamicData.targetSystem || ''}
                onChange={(e) => handleChange('targetSystem', e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-app-background border border-brand-secondary/40 rounded-xl text-brand-primary placeholder:text-brand-secondary/60 focus:outline-none focus:ring-2 focus:ring-brand-accent/40 focus:border-brand-primary transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-brand-primary mb-1.5">
                Account ID / Username Affected
              </label>
              <input
                type="text"
                placeholder="e.g. john.doe@apex.com or STD-2024-089"
                value={dynamicData.accountUsername || ''}
                onChange={(e) => handleChange('accountUsername', e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-app-background border border-brand-secondary/40 rounded-xl text-brand-primary placeholder:text-brand-secondary/60 focus:outline-none focus:ring-2 focus:ring-brand-accent/40 focus:border-brand-primary transition-colors"
              />
            </div>
          </>
        )}

        {catKey === 'general' && (
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-brand-primary mb-1.5">
              Preferred Callback / Contact Method
            </label>
            <input
              type="text"
              placeholder="e.g. Teams chat, Mobile phone, Desk extension"
              value={dynamicData.preferredContact || ''}
              onChange={(e) => handleChange('preferredContact', e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-app-background border border-brand-secondary/40 rounded-xl text-brand-primary placeholder:text-brand-secondary/60 focus:outline-none focus:ring-2 focus:ring-brand-accent/40 focus:border-brand-primary transition-colors"
            />
          </div>
        )}
      </div>
    </div>
  );
};
