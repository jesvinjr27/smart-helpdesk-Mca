import React from 'react';

export const Step3ReviewSubmit = ({
  issueType,
  title,
  description,
  files,
  selectedCategory,
  dynamicData,
  priority,
  tags,
  duplicateCheckLoading,
  duplicateResults,
  submitting,
  onBack,
  onGoToStep,
  onClearDraft,
  onSubmit,
}) => {
  const getPriorityBadge = (p) => {
    switch (p) {
      case 'CRITICAL':
        return 'bg-red-500/15 text-red-700 border-red-500/30';
      case 'HIGH':
        return 'bg-amber-500/15 text-amber-800 border-amber-500/30';
      case 'LOW':
        return 'bg-emerald-500/15 text-emerald-700 border-emerald-500/30';
      default:
        return 'bg-blue-500/15 text-blue-700 border-blue-500/30';
    }
  };

  const getPrioritySla = (p) => {
    switch (p) {
      case 'CRITICAL':
        return '1 hour resolution SLA';
      case 'HIGH':
        return '8 hours resolution SLA';
      case 'LOW':
        return '48 hours resolution SLA';
      default:
        return '24 hours resolution SLA';
    }
  };

  return (
    <div className="card-glow p-5 sm:p-7 rounded-2xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-brand-primary/15">
        <div>
          <h3 className="text-base font-bold text-brand-primary m-0">
            Review Ticket Submission
          </h3>
          <p className="text-xs text-brand-secondary m-0 mt-0.5">
            Please verify all details before submitting to the help desk queue.
          </p>
        </div>
        <button
          type="button"
          onClick={onClearDraft}
          className="text-xs text-brand-secondary hover:text-brand-primary transition-colors inline-flex items-center gap-1"
        >
          <i className="bi bi-trash3 text-xs" />
          <span>Clear Draft</span>
        </button>
      </div>

      {/* Duplicate Ticket Advisory Banner */}
      {duplicateCheckLoading ? (
        <div className="p-3.5 rounded-xl bg-brand-secondary/15 border border-brand-secondary/35 text-xs text-brand-primary flex items-center gap-2.5">
          <span className="w-4 h-4 border-2 border-brand-primary border-t-transparent rounded-full animate-spin flex-shrink-0" />
          <span>Scanning organization records for potentially similar open incidents...</span>
        </div>
      ) : duplicateResults?.has_duplicates && duplicateResults.duplicates.length > 0 ? (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-3">
          <div className="flex items-start gap-2.5">
            <i className="bi bi-exclamation-triangle-fill text-amber-600 text-lg flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-xs sm:text-sm text-amber-900 m-0 leading-tight">
                Similar Open Ticket Detected ({duplicateResults.duplicates.length})
              </h4>
              <p className="text-xs text-amber-800 m-0 mt-1 leading-relaxed">
                We detected open tickets in your organization with matching symptoms. If your issue is already being addressed, you may avoid duplicate processing.
              </p>
            </div>
          </div>

          <div className="space-y-2 pt-1">
            {duplicateResults.duplicates.map((dup) => (
              <div
                key={dup.ticket_id}
                className="p-3 rounded-xl bg-app-background border border-amber-500/25 flex flex-wrap items-center justify-between gap-2 text-xs"
              >
                <div>
                  <span className="font-mono font-bold text-brand-primary mr-2">
                    {dup.ticket_number}
                  </span>
                  <span className="font-medium text-brand-primary">{dup.title}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-brand-secondary/20 text-brand-primary">
                    {Math.round(dup.similarity_score * 100)}% match
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-amber-500/20 text-amber-900">
                    {dup.status}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <p className="text-[11px] text-amber-800/80 m-0 italic">
            Note: You are still free to submit this ticket if this is a distinct issue.
          </p>
        </div>
      ) : null}

      {/* Summary Cards */}
      <div className="space-y-4">
        {/* Card 1: Issue Summary */}
        <div className="p-4 rounded-xl bg-app-background border border-brand-primary/15 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-wider font-bold text-brand-secondary flex items-center gap-1.5">
              <i className="bi bi-file-earmark-text text-brand-primary" />
              <span>Issue Details</span>
            </span>
            <button
              type="button"
              onClick={() => onGoToStep(1)}
              className="text-xs text-brand-primary hover:underline font-semibold inline-flex items-center gap-1"
            >
              <i className="bi bi-pencil-square" />
              <span>Edit</span>
            </button>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-brand-primary text-white">
                {issueType}
              </span>
              <h4 className="font-bold text-base text-brand-primary m-0">
                {title}
              </h4>
            </div>

            <div className="p-3 rounded-lg bg-brand-secondary/10 border border-brand-secondary/20 text-xs text-brand-primary whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto">
              {description}
            </div>
          </div>
        </div>

        {/* Card 2: Classification & SLA */}
        <div className="p-4 rounded-xl bg-app-background border border-brand-primary/15 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-wider font-bold text-brand-secondary flex items-center gap-1.5">
              <i className="bi bi-tags text-brand-primary" />
              <span>Classification & SLA Policy</span>
            </span>
            <button
              type="button"
              onClick={() => onGoToStep(2)}
              className="text-xs text-brand-primary hover:underline font-semibold inline-flex items-center gap-1"
            >
              <i className="bi bi-pencil-square" />
              <span>Edit</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-brand-secondary/10 border border-brand-secondary/20 space-y-1">
              <span className="text-[11px] text-brand-secondary uppercase tracking-wider block">
                Category & Subcategory
              </span>
              <div className="font-bold text-sm text-brand-primary">
                {selectedCategory?.name || 'General'}
              </div>
              {dynamicData?.subcategory && (
                <div className="text-xs text-brand-secondary">
                  Area: <b className="text-brand-primary">{dynamicData.subcategory}</b>
                </div>
              )}
            </div>

            <div className="p-3 rounded-xl bg-brand-secondary/10 border border-brand-secondary/20 space-y-1">
              <span className="text-[11px] text-brand-secondary uppercase tracking-wider block">
                Priority & Target
              </span>
              <div className="flex items-center gap-2">
                <span className={`px-2.5 py-0.5 rounded-md text-xs font-bold border ${getPriorityBadge(priority)}`}>
                  {priority}
                </span>
                <span className="text-xs text-brand-secondary">
                  {getPrioritySla(priority)}
                </span>
              </div>
            </div>
          </div>

          {/* Dynamic contextual attributes list */}
          {Object.keys(dynamicData).filter((k) => k !== 'subcategory' && dynamicData[k]).length > 0 && (
            <div className="pt-2 border-t border-brand-primary/10">
              <span className="text-[11px] text-brand-secondary uppercase tracking-wider block mb-1.5">
                Specific Attributes
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {Object.entries(dynamicData)
                  .filter(([k, v]) => k !== 'subcategory' && Boolean(v))
                  .map(([k, v]) => (
                    <div key={k} className="p-2 rounded-lg bg-brand-secondary/10 text-xs">
                      <span className="text-[10px] text-brand-secondary capitalize block">
                        {k.replace(/([A-Z])/g, ' $1')}
                      </span>
                      <span className="font-semibold text-brand-primary truncate block">
                        {v}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Tags */}
          {tags.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap pt-1">
              <span className="text-[11px] text-brand-secondary">Tags:</span>
              {tags.map((t, i) => (
                <span
                  key={i}
                  className="px-2 py-0.5 rounded text-[11px] font-medium bg-brand-secondary/20 text-brand-primary border border-brand-secondary/30"
                >
                  #{t}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Card 3: Attachments */}
        <div className="p-4 rounded-xl bg-app-background border border-brand-primary/15 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-wider font-bold text-brand-secondary flex items-center gap-1.5">
              <i className="bi bi-paperclip text-brand-primary" />
              <span>Attached Documents & Screenshots ({files.length})</span>
            </span>
            <button
              type="button"
              onClick={() => onGoToStep(1)}
              className="text-xs text-brand-primary hover:underline font-semibold inline-flex items-center gap-1"
            >
              <i className="bi bi-pencil-square" />
              <span>Edit</span>
            </button>
          </div>

          {files.length === 0 ? (
            <p className="text-xs text-brand-secondary m-0">No files attached to this ticket.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              {files.map((f, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 p-2 rounded-lg bg-brand-secondary/10 text-xs text-brand-primary"
                >
                  <i className="bi bi-file-earmark-check text-brand-primary text-base flex-shrink-0" />
                  <span className="truncate flex-1 font-medium">{f.name}</span>
                  <span className="text-[10px] text-brand-secondary flex-shrink-0">
                    {(f.size / 1024).toFixed(0)} KB
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Action Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-brand-primary/10">
        <button
          type="button"
          onClick={onBack}
          className="px-4 py-2.5 rounded-xl border border-brand-primary/20 bg-app-background text-brand-primary hover:bg-brand-secondary/15 font-medium text-xs sm:text-sm transition-colors inline-flex items-center gap-1.5"
        >
          <i className="bi bi-arrow-left text-xs" />
          <span>Back to Classification</span>
        </button>

        <button
          type="button"
          disabled={submitting}
          onClick={onSubmit}
          className="px-6 py-2.5 rounded-xl bg-brand-primary hover:bg-brand-primary/90 text-white font-semibold text-xs sm:text-sm shadow-subtle transition-all inline-flex items-center gap-2 disabled:opacity-50"
        >
          {submitting ? (
            <>
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Submitting Ticket...</span>
            </>
          ) : (
            <>
              <i className="bi bi-send-fill text-xs" />
              <span>Confirm & Submit Ticket</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
