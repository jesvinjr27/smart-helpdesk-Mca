import React from 'react';

const getCategoryMeta = (name = '') => {
  const lower = name.toLowerCase();
  if (lower.includes('hardware') || lower.includes('workstation') || lower.includes('lab')) {
    return {
      icon: 'bi-laptop',
      desc: 'Laptops, monitors, workstations & lab devices',
      badge: 'Physical Tech',
    };
  }
  if (lower.includes('network') || lower.includes('wifi') || lower.includes('wi-fi') || lower.includes('vpn')) {
    return {
      icon: 'bi-wifi',
      desc: 'Campus Wi-Fi, Ethernet, VPN & network connections',
      badge: 'Connectivity',
    };
  }
  if (lower.includes('software') || lower.includes('app')) {
    return {
      icon: 'bi-window-stack',
      desc: 'OS issues, desktop applications & office suites',
      badge: 'Software',
    };
  }
  if (lower.includes('access') || lower.includes('identity') || lower.includes('account')) {
    return {
      icon: 'bi-shield-lock',
      desc: 'Single sign-on, passwords, permissions & 2FA',
      badge: 'Security',
    };
  }
  if (lower.includes('lms') || lower.includes('student') || lower.includes('portal') || lower.includes('library')) {
    return {
      icon: 'bi-mortarboard',
      desc: 'Canvas LMS, grades, course portals & library databases',
      badge: 'Academic',
    };
  }
  if (lower.includes('email') || lower.includes('communication')) {
    return {
      icon: 'bi-envelope-at',
      desc: 'Outlook, distribution lists & email delivery',
      badge: 'Email',
    };
  }
  if (lower.includes('human') || lower.includes('benefit') || lower.includes('hr')) {
    return {
      icon: 'bi-people',
      desc: 'Onboarding, employee records & workplace requests',
      badge: 'People Ops',
    };
  }
  return {
    icon: 'bi-question-circle',
    desc: 'General technical support & miscellaneous inquiries',
    badge: 'General',
  };
};

export const CategoryCard = ({ category, isSelected, onSelect }) => {
  const meta = getCategoryMeta(category.name);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onSelect(category.id)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(category.id);
        }
      }}
      className={`relative p-4 rounded-2xl border text-left cursor-pointer transition-all duration-200 select-none flex flex-col justify-between ${
        isSelected
          ? 'bg-brand-primary text-white border-brand-primary shadow-subtle ring-2 ring-brand-primary/40 scale-[1.01]'
          : 'bg-app-background border-brand-primary/15 text-brand-primary hover:border-brand-primary/40 hover:bg-brand-secondary/10'
      }`}
    >
      <div>
        <div className="flex items-center justify-between gap-2 mb-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg transition-colors ${
              isSelected ? 'bg-white text-brand-primary shadow-sm' : 'bg-brand-secondary/20 text-brand-primary'
            }`}
          >
            <i className={`bi ${meta.icon}`} />
          </div>
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
              isSelected
                ? 'bg-white/20 text-white border border-white/30'
                : 'bg-brand-secondary/20 text-brand-primary border border-brand-secondary/30'
            }`}
          >
            {meta.badge}
          </span>
        </div>

        <h4 className="font-bold text-sm leading-snug mb-1 truncate">
          {category.name}
        </h4>
        <p className={`text-xs line-clamp-2 leading-relaxed m-0 ${isSelected ? 'text-white/80' : 'text-brand-secondary'}`}>
          {meta.desc}
        </p>
      </div>

      <div className="mt-3 pt-2.5 border-t border-brand-primary/10 flex items-center justify-between">
        <span className={`text-[11px] font-medium ${isSelected ? 'text-white/90 font-semibold' : 'text-brand-secondary'}`}>
          {isSelected ? 'Selected Category' : 'Click to select'}
        </span>
        <div
          className={`w-5 h-5 rounded-full flex items-center justify-center text-xs transition-colors ${
            isSelected ? 'bg-white text-brand-primary' : 'border border-brand-secondary/40 text-transparent'
          }`}
        >
          <i className="bi bi-check-lg" />
        </div>
      </div>
    </div>
  );
};
