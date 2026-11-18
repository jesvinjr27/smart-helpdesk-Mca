import React from 'react';

const PRIORITIES = [
  {
    key: 'LOW',
    title: 'Low',
    sla: '48h target',
    desc: 'General inquiry or minor issue with normal workaround.',
    badgeColor: 'bg-emerald-500/15 text-emerald-700 border-emerald-500/30',
    activeRing: 'ring-emerald-500/50',
    icon: 'bi-info-circle',
  },
  {
    key: 'MEDIUM',
    title: 'Medium',
    sla: '24h target',
    desc: 'Normal business tasks affected but not totally blocked.',
    badgeColor: 'bg-blue-500/15 text-blue-700 border-blue-500/30',
    activeRing: 'ring-blue-500/50',
    icon: 'bi-dash-circle',
  },
  {
    key: 'HIGH',
    title: 'High',
    sla: '8h target',
    desc: 'Significant productivity blocker without easy workaround.',
    badgeColor: 'bg-amber-500/15 text-amber-800 border-amber-500/30',
    activeRing: 'ring-amber-500/50',
    icon: 'bi-arrow-up-circle',
  },
  {
    key: 'CRITICAL',
    title: 'Critical',
    sla: '1h target',
    desc: 'Complete work stoppage or core service outage.',
    badgeColor: 'bg-red-500/15 text-red-700 border-red-500/30',
    activeRing: 'ring-red-500/50',
    icon: 'bi-exclamation-octagon-fill',
  },
];

export const PrioritySelector = ({ priority, onChange, criticalAutoNotice }) => {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-semibold uppercase tracking-wider text-brand-primary">
          Impact & Priority Level
        </label>
        <span className="text-[11px] text-brand-secondary">
          Defines SLA resolution timeline
        </span>
      </div>

      {criticalAutoNotice && (
        <div className="p-3 rounded-xl bg-brand-primary/10 border border-brand-primary/30 text-xs text-brand-primary flex items-start gap-2.5">
          <i className="bi bi-shield-exclamation text-brand-primary text-base flex-shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <span className="font-bold">Automated Escalation:</span> Emergency outage keywords were detected in your issue description. Priority has been preset to <b>CRITICAL</b> with a 1-hour resolution commitment.
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {PRIORITIES.map((p) => {
          const isSelected = priority === p.key;

          return (
            <div
              key={p.key}
              role="button"
              tabIndex={0}
              onClick={() => onChange(p.key)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onChange(p.key);
                }
              }}
              className={`p-3.5 rounded-2xl border text-left cursor-pointer transition-all duration-200 select-none flex flex-col justify-between ${
                isSelected
                  ? `bg-brand-primary text-white border-brand-primary shadow-subtle ring-2 ${p.activeRing} scale-[1.01]`
                  : 'bg-app-background border-brand-primary/15 text-brand-primary hover:border-brand-primary/40 hover:bg-brand-secondary/10'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-1.5 mb-2">
                  <span className="font-bold text-sm inline-flex items-center gap-1.5">
                    <i className={`bi ${p.icon} text-xs`} />
                    <span>{p.title}</span>
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      isSelected ? 'bg-white/20 text-white border-white/30' : p.badgeColor
                    }`}
                  >
                    {p.sla}
                  </span>
                </div>
                <p className={`text-[11px] leading-relaxed m-0 ${isSelected ? 'text-white/80' : 'text-brand-secondary'}`}>
                  {p.desc}
                </p>
              </div>

              <div className="mt-3 pt-2 border-t border-brand-primary/10 flex items-center justify-between text-[10px]">
                <span className={isSelected ? 'text-white/90 font-semibold' : 'text-brand-secondary'}>
                  {isSelected ? 'Active Priority' : 'Select'}
                </span>
                <div
                  className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${
                    isSelected ? 'bg-white text-brand-primary font-bold' : 'border border-brand-secondary/40 text-transparent'
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
