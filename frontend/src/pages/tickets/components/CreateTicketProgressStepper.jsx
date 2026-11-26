import React from 'react';

export const CreateTicketProgressStepper = ({ currentStep, setStep, completedSteps }) => {
  const steps = [
    { number: 1, title: 'Describe Issue', desc: 'Subject, details & files', icon: 'bi-file-earmark-text' },
    { number: 2, title: 'Classify Request', desc: 'Category, details & priority', icon: 'bi-grid-fill' },
    { number: 3, title: 'Review & Submit', desc: 'Verify summary & submit', icon: 'bi-check2-circle' },
  ];

  return (
    <div className="card-glow p-4 sm:p-5 rounded-2xl mb-6">
      <div className="grid grid-cols-3 gap-2 sm:gap-4 relative">
        {steps.map((s, idx) => {
          const isActive = currentStep === s.number;
          const isCompleted = completedSteps.includes(s.number);
          const isClickable = isCompleted || s.number < currentStep;

          return (
            <div
              key={s.number}
              onClick={() => isClickable && setStep(s.number)}
              className={`relative flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-2 sm:gap-3.5 p-2 sm:p-3 rounded-xl transition-all duration-200 ${
                isActive
                  ? 'bg-brand-primary text-white shadow-subtle'
                  : isCompleted
                  ? 'bg-brand-secondary/15 text-brand-primary hover:bg-brand-secondary/25 cursor-pointer'
                  : 'bg-transparent text-brand-secondary/70 opacity-60'
              }`}
            >
              <div
                className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center font-bold text-xs sm:text-sm flex-shrink-0 transition-colors ${
                  isActive
                    ? 'bg-white text-brand-primary shadow-sm'
                    : isCompleted
                    ? 'bg-brand-primary text-white'
                    : 'bg-brand-secondary/20 text-brand-secondary'
                }`}
              >
                {isCompleted && !isActive ? (
                  <i className="bi bi-check-lg text-sm sm:text-base" />
                ) : (
                  <i className={`bi ${s.icon} text-xs sm:text-sm`} />
                )}
              </div>
              <div className="min-w-0 flex-1 hidden sm:block">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] uppercase font-bold tracking-wider opacity-80">
                    Step {s.number}
                  </span>
                  {isCompleted && !isActive && (
                    <span className="text-[10px] text-brand-primary font-semibold">Done</span>
                  )}
                </div>
                <h4 className="text-xs sm:text-sm font-bold truncate leading-tight mt-0.5">
                  {s.title}
                </h4>
                <p className={`text-[11px] truncate leading-tight mt-0.5 ${isActive ? 'text-white/80' : 'text-brand-secondary'}`}>
                  {s.desc}
                </p>
              </div>

              {/* Mobile text */}
              <span className="block sm:hidden text-[10px] font-bold truncate max-w-full">
                {s.title}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
