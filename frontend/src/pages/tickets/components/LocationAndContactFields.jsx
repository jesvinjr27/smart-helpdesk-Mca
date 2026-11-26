import React from 'react';

export const CAMPUS_BUILDINGS = [
  'Main Engineering & Tech Complex',
  'Academic Hall A (Classrooms & Lecture Theatres)',
  'Academic Hall B (Science & Research Labs)',
  'University Central Library & Learning Hub',
  'Student Life & Administrative Services',
  'Campus Residence & Dormitories',
  'Off-Campus / Remote / Home Office',
  'Other Campus Location',
];

export const CONTACT_METHODS = [
  {
    key: 'TEAMS',
    label: 'Microsoft Teams',
    icon: 'bi-chat-dots-fill',
    desc: 'Direct message on Teams',
    placeholder: 'Teams email or @username',
  },
  {
    key: 'EMAIL',
    label: 'Email',
    icon: 'bi-envelope-fill',
    desc: 'Email updates and resolution link',
    placeholder: 'Primary contact email',
  },
  {
    key: 'PHONE',
    label: 'Mobile / SMS',
    icon: 'bi-phone-fill',
    desc: 'Direct call or urgent SMS alert',
    placeholder: 'Mobile phone number',
  },
  {
    key: 'EXTENSION',
    label: 'Desk Extension',
    icon: 'bi-telephone-fill',
    desc: 'On-premise desk phone',
    placeholder: 'e.g. Ext 4410 or Dept Line',
  },
];

export const LocationAndContactFields = ({
  locationData,
  setLocationData,
  currentUserEmail = '',
}) => {
  const handleChange = (field, value) => {
    setLocationData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const selectedMethod = CONTACT_METHODS.find((m) => m.key === (locationData.contactMethod || 'EMAIL')) || CONTACT_METHODS[1];

  return (
    <div id="context-location" className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-brand-primary">
            Step 4: Location, Contact & System Context (Optional)
          </label>
          <p className="text-[11px] text-brand-secondary m-0 mt-0.5">
            Helps field technicians locate your workstation and reach you promptly
          </p>
        </div>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-secondary/20 text-brand-primary border border-brand-secondary/30 uppercase tracking-wider">
          Field Dispatch
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Building */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-brand-primary mb-1.5">
            Campus Building / Facility
          </label>
          <div className="relative">
            <select
              value={locationData.building || CAMPUS_BUILDINGS[0]}
              onChange={(e) => handleChange('building', e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-app-background border border-brand-secondary/40 rounded-xl text-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-accent/40 focus:border-brand-primary transition-colors cursor-pointer appearance-none pr-9"
            >
              {CAMPUS_BUILDINGS.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
            <i className="bi bi-chevron-down absolute right-3.5 top-1/2 -translate-y-1/2 text-brand-secondary pointer-events-none text-xs" />
          </div>
        </div>

        {/* Room / Desk */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-brand-primary mb-1.5">
            Room Number / Lab / Desk ID
          </label>
          <div className="relative">
            <input
              type="text"
              value={locationData.roomNumber || ''}
              onChange={(e) => handleChange('roomNumber', e.target.value)}
              placeholder="e.g. Room 304, Computer Lab 2, or Desk 14B"
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-app-background border border-brand-secondary/40 rounded-xl text-brand-primary placeholder:text-brand-secondary/60 focus:outline-none focus:ring-2 focus:ring-brand-accent/40 focus:border-brand-primary transition-colors"
            />
            <i className="bi bi-geo-alt absolute right-3.5 top-1/2 -translate-y-1/2 text-brand-secondary text-xs pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Preferred Contact Method */}
      <div className="space-y-2">
        <label className="block text-xs font-semibold uppercase tracking-wider text-brand-primary">
          Preferred Contact Channel
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {CONTACT_METHODS.map((method) => {
            const isSelected = (locationData.contactMethod || 'EMAIL') === method.key;
            return (
              <div
                key={method.key}
                role="button"
                tabIndex={0}
                onClick={() => handleChange('contactMethod', method.key)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleChange('contactMethod', method.key);
                  }
                }}
                className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all duration-150 select-none flex items-center gap-2 ${
                  isSelected
                    ? 'bg-brand-primary text-white border-brand-primary shadow-subtle ring-2 ring-brand-primary/40'
                    : 'bg-app-background border-brand-primary/15 text-brand-primary hover:border-brand-primary/40 hover:bg-brand-secondary/10'
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs flex-shrink-0 ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-brand-secondary/20 text-brand-primary'
                  }`}
                >
                  <i className={`bi ${method.icon}`} />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold truncate leading-tight">{method.label}</div>
                  <div className={`text-[10px] truncate ${isSelected ? 'text-white/80' : 'text-brand-secondary'}`}>
                    {method.desc}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Contact Identifier */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-brand-primary mb-1.5">
            Contact Details ({selectedMethod.label})
          </label>
          <input
            type="text"
            value={locationData.contactDetail ?? (selectedMethod.key === 'EMAIL' ? currentUserEmail : '')}
            onChange={(e) => handleChange('contactDetail', e.target.value)}
            placeholder={selectedMethod.placeholder}
            className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-app-background border border-brand-secondary/40 rounded-xl text-brand-primary placeholder:text-brand-secondary/60 focus:outline-none focus:ring-2 focus:ring-brand-accent/40 focus:border-brand-primary transition-colors"
          />
        </div>

        {/* Affected System or Software */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-brand-primary mb-1.5">
            Affected Service or Enterprise Application
          </label>
          <input
            type="text"
            value={locationData.affectedService || ''}
            onChange={(e) => handleChange('affectedService', e.target.value)}
            placeholder="e.g. Canvas LMS, VPN Client, Workday, Office 365, Eduroam"
            className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-app-background border border-brand-secondary/40 rounded-xl text-brand-primary placeholder:text-brand-secondary/60 focus:outline-none focus:ring-2 focus:ring-brand-accent/40 focus:border-brand-primary transition-colors"
          />
        </div>
      </div>
    </div>
  );
};
