import React from 'react';

export const REQUEST_TYPES = [
  {
    key: 'INCIDENT',
    title: 'Incident',
    badge: 'Disruption',
    desc: 'Something is broken, unresponsive, or not functioning correctly.',
    examples: 'e.g. Laptop not starting, Wi-Fi outage, VPN failure, exam portal down.',
    icon: 'bi-exclamation-octagon-fill',
    badgeColor: 'bg-red-500/15 text-red-700 border-red-500/30',
  },
  {
    key: 'SERVICE_REQUEST',
    title: 'Service Request',
    badge: 'Fulfillment',
    desc: 'Requesting a standard technical service, new hardware, or software setup.',
    examples: 'e.g. New software license, additional monitor, peripheral request.',
    icon: 'bi-box-seam-fill',
    badgeColor: 'bg-blue-500/15 text-blue-700 border-blue-500/30',
  },
  {
    key: 'ACCESS_REQUEST',
    title: 'Access Request',
    badge: 'Security',
    desc: 'Requesting user credentials, permissions, portal access, or role changes.',
    examples: 'e.g. New account setup, Canvas LMS enrollment, 2FA/password reset.',
    icon: 'bi-shield-lock-fill',
    badgeColor: 'bg-emerald-500/15 text-emerald-700 border-emerald-500/30',
  },
  {
    key: 'GENERAL_REQUEST',
    title: 'General Support',
    badge: 'Inquiry',
    desc: 'General technical support, IT policy advice, or unclassified questions.',
    examples: 'e.g. Equipment relocation, how-to inquiries, tech guidance.',
    icon: 'bi-chat-left-dots-fill',
    badgeColor: 'bg-purple-500/15 text-purple-700 border-purple-500/30',
  },
];

export const RequestTypeSelector = ({ selectedType, onSelect }) => {
  return (
    <div id="request-type" className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-semibold uppercase tracking-wider text-brand-primary">
          Step 1: Choose Request Type <span className="text-brand-primary font-bold">*</span>
        </label>
        <span className="text-[11px] text-brand-secondary">
          Adapts form fields & routing automatically
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {REQUEST_TYPES.map((type) => {
          const isSelected = selectedType === type.key;

          return (
            <div
              key={type.key}
              role="button"
              tabIndex={0}
              onClick={() => onSelect(type.key)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelect(type.key);
                }
              }}
              className={`p-4 rounded-2xl border text-left cursor-pointer transition-all duration-200 select-none flex flex-col justify-between ${
                isSelected
                  ? 'bg-brand-primary text-white border-brand-primary shadow-subtle ring-2 ring-brand-primary/40 scale-[1.01]'
                  : 'bg-app-background border-brand-primary/15 text-brand-primary hover:border-brand-primary/40 hover:bg-brand-secondary/10'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2.5">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center text-base transition-colors ${
                      isSelected
                        ? 'bg-white text-brand-primary shadow-sm'
                        : 'bg-brand-secondary/20 text-brand-primary'
                    }`}
                  >
                    <i className={`bi ${type.icon}`} />
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider ${
                      isSelected
                        ? 'bg-white/20 text-white border-white/30'
                        : type.badgeColor
                    }`}
                  >
                    {type.badge}
                  </span>
                </div>

                <h4 className="font-bold text-sm leading-snug mb-1 m-0">
                  {type.title}
                </h4>
                <p className={`text-xs leading-relaxed m-0 mt-1 line-clamp-2 ${isSelected ? 'text-white/80' : 'text-brand-secondary'}`}>
                  {type.desc}
                </p>
              </div>

              <div className="mt-3 pt-2 border-t border-brand-primary/10 flex items-center justify-between text-[11px]">
                <span className={`italic truncate text-[10px] ${isSelected ? 'text-white/70' : 'text-brand-secondary/80'}`}>
                  {type.examples}
                </span>
                <div
                  className={`w-4 h-4 rounded-full flex items-center justify-center text-xs flex-shrink-0 ml-1 ${
                    isSelected
                      ? 'bg-white text-brand-primary font-bold'
                      : 'border border-brand-secondary/40 text-transparent'
                  }`}
                >
                  <i className="bi bi-check" />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
