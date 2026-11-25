import React, { useMemo } from 'react';

export const EMERGENCY_REGEX = /\b(server down|system outage|data loss|security breach|ransomware|fire|leakage|work stoppage|entire campus down|database corrupted|infrastructure failure)\b/i;

export const IMPACT_OPTIONS = [
  {
    key: 'ONLY_ME',
    title: 'Only Me',
    subtitle: 'Single user affected',
    desc: 'Impacts one workstation or account; work can partially continue or workaround exists.',
    icon: 'bi-person',
  },
  {
    key: 'FEW_USERS',
    title: 'A Few Users',
    subtitle: 'Workgroup / Lab',
    desc: 'Impacts a small team, shared laboratory workstation, or specific project group.',
    icon: 'bi-people',
  },
  {
    key: 'DEPARTMENT',
    title: 'Department',
    subtitle: 'Division / Lecture Hall',
    desc: 'Impacts an entire academic department, lecture hall, or operational branch.',
    icon: 'bi-diagram-3',
  },
  {
    key: 'ORGANIZATION',
    title: 'Entire Campus',
    subtitle: 'Organization-wide',
    desc: 'Mission-critical outage affecting all staff, faculty, students, or public services.',
    icon: 'bi-buildings',
  },
];

export const URGENCY_OPTIONS = [
  {
    key: 'LOW',
    title: 'Low',
    subtitle: 'Can wait',
    desc: 'Operational inquiry, scheduled task, or minor cosmetic issue.',
    icon: 'bi-calendar-check',
  },
  {
    key: 'NORMAL',
    title: 'Normal',
    subtitle: 'Standard timeline',
    desc: 'Standard workflow issue; reasonable workaround available for now.',
    icon: 'bi-clock',
  },
  {
    key: 'HIGH',
    title: 'High',
    subtitle: 'Approaching deadline',
    desc: 'Significant blockage, active classroom disruption, or time-sensitive deadline.',
    icon: 'bi-exclamation-triangle',
  },
  {
    key: 'IMMEDIATE',
    title: 'Immediate',
    subtitle: 'Work stopped',
    desc: 'Complete work stoppage, active security risk, or severe outage.',
    icon: 'bi-fire',
  },
];

export const calculatePriority = (impact, urgency, hasEmergency = false) => {
  if (hasEmergency) {
    return {
      priority: 'CRITICAL',
      sla: '1-Hour Target',
      rationale: 'Automated emergency keyword override detected critical business or infrastructure disruption.',
      badgeColor: 'bg-red-500/15 text-red-700 border-red-500/30',
      icon: 'bi-exclamation-octagon-fill',
    };
  }

  if (impact === 'ORGANIZATION') {
    if (urgency === 'IMMEDIATE') {
      return {
        priority: 'CRITICAL',
        sla: '1-Hour Target',
        rationale: 'Campus/Organization-wide disruption with immediate urgency requires instant incident triage.',
        badgeColor: 'bg-red-500/15 text-red-700 border-red-500/30',
        icon: 'bi-exclamation-octagon-fill',
      };
    }
    if (urgency === 'HIGH') {
      return {
        priority: 'HIGH',
        sla: '8-Hour Target',
        rationale: 'Campus-wide impact with high urgency scheduled for accelerated response.',
        badgeColor: 'bg-amber-500/15 text-amber-800 border-amber-500/30',
        icon: 'bi-arrow-up-circle',
      };
    }
    return {
      priority: 'MEDIUM',
      sla: '24-Hour Target',
      rationale: 'Wide scope of impact but normal/low urgency; addressed within standard window.',
      badgeColor: 'bg-blue-500/15 text-blue-700 border-blue-500/30',
      icon: 'bi-dash-circle',
    };
  }

  if (impact === 'DEPARTMENT') {
    if (urgency === 'IMMEDIATE') {
      return {
        priority: 'HIGH',
        sla: '8-Hour Target',
        rationale: 'Departmental work stoppage with immediate urgency prioritizes response.',
        badgeColor: 'bg-amber-500/15 text-amber-800 border-amber-500/30',
        icon: 'bi-arrow-up-circle',
      };
    }
    if (urgency === 'HIGH' || urgency === 'NORMAL') {
      return {
        priority: 'MEDIUM',
        sla: '24-Hour Target',
        rationale: 'Departmental impact with moderate urgency; handled within 24 hours.',
        badgeColor: 'bg-blue-500/15 text-blue-700 border-blue-500/30',
        icon: 'bi-dash-circle',
      };
    }
    return {
      priority: 'LOW',
      sla: '48-Hour Target',
      rationale: 'Departmental inquiry with low operational urgency.',
      badgeColor: 'bg-emerald-500/15 text-emerald-700 border-emerald-500/30',
      icon: 'bi-info-circle',
    };
  }

  if (impact === 'FEW_USERS') {
    if (urgency === 'IMMEDIATE') {
      return {
        priority: 'HIGH',
        sla: '8-Hour Target',
        rationale: 'Immediate work stoppage for a small group or lab.',
        badgeColor: 'bg-amber-500/15 text-amber-800 border-amber-500/30',
        icon: 'bi-arrow-up-circle',
      };
    }
    if (urgency === 'HIGH') {
      return {
        priority: 'MEDIUM',
        sla: '24-Hour Target',
        rationale: 'High urgency for a small workgroup prioritized for same-day resolution.',
        badgeColor: 'bg-blue-500/15 text-blue-700 border-blue-500/30',
        icon: 'bi-dash-circle',
      };
    }
    return {
      priority: 'LOW',
      sla: '48-Hour Target',
      rationale: 'Small workgroup issue or request with standard resolution timeline.',
      badgeColor: 'bg-emerald-500/15 text-emerald-700 border-emerald-500/30',
      icon: 'bi-info-circle',
    };
  }

  // ONLY_ME
  if (urgency === 'IMMEDIATE') {
    return {
      priority: 'HIGH',
      sla: '8-Hour Target',
      rationale: 'Individual user with complete work stoppage.',
      badgeColor: 'bg-amber-500/15 text-amber-800 border-amber-500/30',
      icon: 'bi-arrow-up-circle',
    };
  }
  if (urgency === 'HIGH') {
    return {
      priority: 'MEDIUM',
      sla: '24-Hour Target',
      rationale: 'Individual user with urgent deadline or classroom delivery blocker.',
      badgeColor: 'bg-blue-500/15 text-blue-700 border-blue-500/30',
      icon: 'bi-dash-circle',
    };
  }
  return {
    priority: 'LOW',
    sla: '48-Hour Target',
    rationale: 'Individual request or issue with standard turnaround time.',
    badgeColor: 'bg-emerald-500/15 text-emerald-700 border-emerald-500/30',
    icon: 'bi-info-circle',
  };
};

export const ImpactUrgencyMatrix = ({
  impact,
  setImpact,
  urgency,
  setUrgency,
  isOverride,
  setIsOverride,
  overridePriority,
  setOverridePriority,
  overrideReason,
  setOverrideReason,
  subjectText = '',
  descText = '',
}) => {
  const hasEmergency = useMemo(() => {
    return EMERGENCY_REGEX.test(subjectText) || EMERGENCY_REGEX.test(descText);
  }, [subjectText, descText]);

  const computed = useMemo(() => {
    return calculatePriority(impact, urgency, hasEmergency);
  }, [impact, urgency, hasEmergency]);

  const activePriority = isOverride && !hasEmergency ? overridePriority : computed.priority;

  return (
    <div id="impact-urgency" className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-brand-primary">
            Step 3: Impact & Urgency Matrix (ITIL Priority) <span className="text-brand-primary font-bold">*</span>
          </label>
          <p className="text-[11px] text-brand-secondary m-0 mt-0.5">
            Transparently establishes service SLA without guesswork
          </p>
        </div>
      </div>

      {hasEmergency && (
        <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/30 text-xs text-red-700 flex items-start gap-2.5 shadow-sm">
          <i className="bi bi-shield-exclamation text-red-600 text-lg flex-shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <span className="font-bold">Automated Incident Escalation:</span> Critical outage keywords were detected in your title or description. System has locked priority to <b>CRITICAL (1-Hour SLA)</b> for emergency triage.
          </div>
        </div>
      )}

      {/* Impact Selection */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-brand-primary">
            1. Who or what is affected? (Impact)
          </span>
          <span className="text-[11px] text-brand-secondary">Scope of disruption</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {IMPACT_OPTIONS.map((opt) => {
            const isSelected = impact === opt.key;
            return (
              <div
                key={opt.key}
                role="button"
                tabIndex={0}
                onClick={() => setImpact(opt.key)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setImpact(opt.key);
                  }
                }}
                className={`p-3 rounded-xl border text-left cursor-pointer transition-all duration-150 select-none ${
                  isSelected
                    ? 'bg-brand-primary text-white border-brand-primary shadow-subtle ring-2 ring-brand-primary/40'
                    : 'bg-app-background border-brand-primary/15 text-brand-primary hover:border-brand-primary/40 hover:bg-brand-secondary/10'
                }`}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center text-sm ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-brand-secondary/20 text-brand-primary'
                    }`}
                  >
                    <i className={`bi ${opt.icon}`} />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold m-0 leading-tight">{opt.title}</h5>
                    <span className={`text-[10px] ${isSelected ? 'text-white/80' : 'text-brand-secondary'}`}>
                      {opt.subtitle}
                    </span>
                  </div>
                </div>
                <p className={`text-[11px] leading-snug m-0 ${isSelected ? 'text-white/80' : 'text-brand-secondary'}`}>
                  {opt.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Urgency Selection */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-brand-primary">
            2. How time-sensitive is the resolution? (Urgency)
          </span>
          <span className="text-[11px] text-brand-secondary">Time criticality</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {URGENCY_OPTIONS.map((opt) => {
            const isSelected = urgency === opt.key;
            return (
              <div
                key={opt.key}
                role="button"
                tabIndex={0}
                onClick={() => setUrgency(opt.key)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setUrgency(opt.key);
                  }
                }}
                className={`p-3 rounded-xl border text-left cursor-pointer transition-all duration-150 select-none ${
                  isSelected
                    ? 'bg-brand-primary text-white border-brand-primary shadow-subtle ring-2 ring-brand-primary/40'
                    : 'bg-app-background border-brand-primary/15 text-brand-primary hover:border-brand-primary/40 hover:bg-brand-secondary/10'
                }`}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center text-sm ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-brand-secondary/20 text-brand-primary'
                    }`}
                  >
                    <i className={`bi ${opt.icon}`} />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold m-0 leading-tight">{opt.title}</h5>
                    <span className={`text-[10px] ${isSelected ? 'text-white/80' : 'text-brand-secondary'}`}>
                      {opt.subtitle}
                    </span>
                  </div>
                </div>
                <p className={`text-[11px] leading-snug m-0 ${isSelected ? 'text-white/80' : 'text-brand-secondary'}`}>
                  {opt.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Computed Result Banner */}
      <div className="p-4 rounded-2xl bg-brand-secondary/10 border border-brand-secondary/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-brand-primary uppercase tracking-wider">
              Calculated ITIL Matrix Result:
            </span>
            <span
              className={`text-xs font-extrabold px-2.5 py-0.5 rounded-full border flex items-center gap-1.5 ${
                computed.badgeColor
              }`}
            >
              <i className={`bi ${computed.icon}`} />
              {activePriority}
            </span>
            <span className="text-xs font-bold text-brand-primary bg-white/70 px-2 py-0.5 rounded-md border border-brand-primary/10">
              {computed.sla}
            </span>
          </div>
          <p className="text-xs text-brand-secondary m-0 leading-relaxed">
            {computed.rationale}
          </p>
        </div>

        {/* Override Toggle */}
        {!hasEmergency && (
          <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-brand-primary whitespace-nowrap self-end sm:self-center select-none">
            <input
              type="checkbox"
              checked={isOverride}
              onChange={(e) => setIsOverride(e.target.checked)}
              className="rounded border-brand-primary/30 text-brand-primary focus:ring-brand-accent/40 w-4 h-4"
            />
            <span>Authorized Priority Override</span>
          </label>
        )}
      </div>

      {/* Override Details if Enabled */}
      {isOverride && !hasEmergency && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-3">
          <div className="flex items-center gap-2 text-amber-800 text-xs font-bold">
            <i className="bi bi-pencil-square" />
            <span>Management / Emergency Override Form</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-amber-900 mb-1">
                Requested Priority Level
              </label>
              <select
                value={overridePriority}
                onChange={(e) => setOverridePriority(e.target.value)}
                className="w-full px-3 py-2 text-xs sm:text-sm bg-app-background border border-amber-500/40 rounded-xl text-brand-primary focus:outline-none focus:ring-2 focus:ring-amber-500/30"
              >
                <option value="LOW">LOW (48h target)</option>
                <option value="MEDIUM">MEDIUM (24h target)</option>
                <option value="HIGH">HIGH (8h target)</option>
                <option value="CRITICAL">CRITICAL (1h target)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-amber-900 mb-1">
                Override Justification <span className="text-red-500 font-bold">*</span>
              </label>
              <input
                type="text"
                value={overrideReason}
                onChange={(e) => setOverrideReason(e.target.value)}
                placeholder="e.g. Dean approved, time-critical symposium in 2 hours"
                className="w-full px-3 py-2 text-xs sm:text-sm bg-app-background border border-amber-500/40 rounded-xl text-brand-primary placeholder:text-brand-secondary/60 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
