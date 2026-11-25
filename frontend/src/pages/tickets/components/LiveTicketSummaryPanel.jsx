import React, { useState } from 'react';
import { REQUEST_TYPES } from './RequestTypeSelector';

const PRIORITY_BADGE_STYLES = {
  LOW: 'bg-emerald-500/15 text-emerald-700 border-emerald-500/30',
  MEDIUM: 'bg-blue-500/15 text-blue-700 border-blue-500/30',
  HIGH: 'bg-amber-500/15 text-amber-800 border-amber-500/30',
  CRITICAL: 'bg-red-500/15 text-red-700 border-red-500/30',
};

const SLA_TARGETS = {
  LOW: '48h SLA',
  MEDIUM: '24h SLA',
  HIGH: '8h SLA',
  CRITICAL: '1h SLA',
};

export const LiveTicketSummaryPanel = ({
  // Form State
  requestType,
  title,
  description,
  selectedCategory,
  dynamicData,
  priority,
  locationData,
  files,
  // Duplicate Detection
  duplicateResults,
  duplicateLoading,
  // Knowledge Base Suggestions
  suggestedKb,
  kbLoading,
  // Draft Management
  lastSavedAt,
  isSavingDraft,
  onSaveDraftManual,
  onDiscardDraft,
  // Submission
  onSubmitTicket,
  submitting,
  validationErrors = [],
}) => {
  const [duplicateExpanded, setDuplicateExpanded] = useState(true);
  const [kbExpanded, setKbExpanded] = useState(true);

  const reqTypeObj = REQUEST_TYPES.find((t) => t.key === requestType) || REQUEST_TYPES[0];

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const wordCount = description.trim() ? description.trim().split(/\s+/).length : 0;
  const isFormValid = title.trim().length >= 3 && description.trim().length >= 5 && selectedCategory;

  return (
    <aside className="space-y-4">
      {/* Real-Time Ticket Summary Card */}
      <div className="bg-app-background border border-brand-primary/15 rounded-3xl p-5 shadow-subtle space-y-4 sticky top-6">
        {/* Card Header & Draft Status */}
        <div className="flex items-center justify-between pb-3 border-b border-brand-primary/10">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h3 className="text-xs sm:text-sm font-bold text-brand-primary uppercase tracking-wider m-0">
              Live Ticket Summary
            </h3>
          </div>
          <div className="text-[11px] text-brand-secondary flex items-center gap-1.5">
            {isSavingDraft ? (
              <span className="flex items-center gap-1 text-brand-primary font-medium">
                <i className="bi bi-arrow-repeat animate-spin text-xs" /> Saving...
              </span>
            ) : lastSavedAt ? (
              <span
                className="flex items-center gap-1 text-emerald-700 font-medium"
                title={`Draft saved locally at ${lastSavedAt.toLocaleTimeString()}`}
              >
                <i className="bi bi-check2-circle text-emerald-600 text-xs" />
                Draft saved ({lastSavedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})
              </span>
            ) : (
              <span className="text-[10px] text-brand-secondary/70">Auto-save active</span>
            )}
          </div>
        </div>

        {/* Section Jump Anchors */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px] font-semibold text-brand-secondary">
          <span className="text-[10px] uppercase tracking-wider text-brand-secondary/70 mr-1">Jump:</span>
          <button
            type="button"
            onClick={() => scrollToSection('request-type')}
            className="px-2 py-0.5 rounded-md hover:bg-brand-secondary/20 hover:text-brand-primary transition-colors whitespace-nowrap"
          >
            Type
          </button>
          <span>•</span>
          <button
            type="button"
            onClick={() => scrollToSection('request-info')}
            className="px-2 py-0.5 rounded-md hover:bg-brand-secondary/20 hover:text-brand-primary transition-colors whitespace-nowrap"
          >
            Issue
          </button>
          <span>•</span>
          <button
            type="button"
            onClick={() => scrollToSection('classification')}
            className="px-2 py-0.5 rounded-md hover:bg-brand-secondary/20 hover:text-brand-primary transition-colors whitespace-nowrap"
          >
            Category
          </button>
          <span>•</span>
          <button
            type="button"
            onClick={() => scrollToSection('impact-urgency')}
            className="px-2 py-0.5 rounded-md hover:bg-brand-secondary/20 hover:text-brand-primary transition-colors whitespace-nowrap"
          >
            Priority
          </button>
          <span>•</span>
          <button
            type="button"
            onClick={() => scrollToSection('context-location')}
            className="px-2 py-0.5 rounded-md hover:bg-brand-secondary/20 hover:text-brand-primary transition-colors whitespace-nowrap"
          >
            Context
          </button>
        </div>

        {/* Structured Spec Overview */}
        <div className="space-y-3 text-xs">
          {/* Request Type */}
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-brand-secondary/10 border border-brand-secondary/20">
            <span className="text-brand-secondary font-medium">Request Type</span>
            <span className="font-bold text-brand-primary flex items-center gap-1.5">
              <i className={`bi ${reqTypeObj.icon} text-xs`} />
              {reqTypeObj.title}
            </span>
          </div>

          {/* Subject Preview */}
          <div className="p-2.5 rounded-xl bg-brand-secondary/10 border border-brand-secondary/20 space-y-1">
            <div className="flex items-center justify-between text-[11px] text-brand-secondary">
              <span>Subject</span>
              <span>{title.length}/255 chars</span>
            </div>
            <div className="font-semibold text-brand-primary truncate">
              {title.trim() ? title : <span className="text-brand-secondary/60 italic font-normal">Not entered yet</span>}
            </div>
          </div>

          {/* Category & Subcategory */}
          <div className="grid grid-cols-2 gap-2">
            <div className="p-2.5 rounded-xl bg-brand-secondary/10 border border-brand-secondary/20">
              <span className="block text-[10px] text-brand-secondary uppercase font-semibold mb-0.5">Category</span>
              <span className="font-bold text-brand-primary truncate block">
                {selectedCategory?.name || 'Pending'}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-brand-secondary/10 border border-brand-secondary/20">
              <span className="block text-[10px] text-brand-secondary uppercase font-semibold mb-0.5">Subcategory</span>
              <span className="font-bold text-brand-primary truncate block">
                {dynamicData?.subcategory || 'General'}
              </span>
            </div>
          </div>

          {/* Priority & SLA Commit */}
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-brand-secondary/10 border border-brand-secondary/20">
            <div>
              <span className="block text-[10px] text-brand-secondary uppercase font-semibold">Priority & SLA</span>
              <span className="font-bold text-brand-primary text-xs">{SLA_TARGETS[priority] || '24h SLA'}</span>
            </div>
            <span
              className={`text-xs font-extrabold px-2.5 py-1 rounded-full border uppercase tracking-wider ${
                PRIORITY_BADGE_STYLES[priority] || PRIORITY_BADGE_STYLES.MEDIUM
              }`}
            >
              {priority}
            </span>
          </div>

          {/* Location & Preferred Channel */}
          {(locationData?.building || locationData?.roomNumber || locationData?.contactMethod) && (
            <div className="p-2.5 rounded-xl bg-brand-secondary/10 border border-brand-secondary/20 space-y-1">
              <div className="text-[10px] text-brand-secondary uppercase font-semibold">Location & Contact</div>
              <div className="font-medium text-brand-primary truncate">
                <i className="bi bi-geo-alt text-brand-secondary mr-1" />
                {locationData.roomNumber ? `${locationData.roomNumber}, ` : ''}
                {locationData.building || 'Campus'}
              </div>
              <div className="text-[11px] text-brand-secondary flex items-center gap-1.5">
                <i className="bi bi-person-badge text-brand-primary" />
                <span>Channel: {locationData.contactMethod || 'Email'}</span>
              </div>
            </div>
          )}

          {/* Attachments & Details Counts */}
          <div className="flex items-center justify-between text-[11px] text-brand-secondary pt-1 px-1">
            <span>
              <i className="bi bi-paperclip mr-1" />
              {files.length} {files.length === 1 ? 'attachment' : 'attachments'}
            </span>
            <span>
              <i className="bi bi-card-text mr-1" />
              {wordCount} words
            </span>
          </div>
        </div>

        {/* Similar Ticket Warning (Duplicate Candidate) */}
        {duplicateLoading && (
          <div className="p-3 rounded-2xl bg-brand-secondary/15 border border-brand-secondary/30 text-xs flex items-center gap-2 text-brand-primary">
            <i className="bi bi-arrow-repeat animate-spin text-sm" />
            <span>Scanning open tickets for duplicates...</span>
          </div>
        )}

        {(() => {
          const candidateList = duplicateResults?.duplicates || duplicateResults?.candidates || [];
          if (!candidateList || candidateList.length === 0) return null;

          return (
            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs space-y-2">
              <div
                role="button"
                tabIndex={0}
                onClick={() => setDuplicateExpanded(!duplicateExpanded)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setDuplicateExpanded(!duplicateExpanded);
                  }
                }}
                className="flex items-center justify-between font-bold text-amber-900 cursor-pointer select-none"
              >
                <div className="flex items-center gap-1.5">
                  <i className="bi bi-exclamation-diamond text-amber-700" />
                  <span>Similar Open Ticket Found ({candidateList.length})</span>
                </div>
                <i className={`bi bi-chevron-${duplicateExpanded ? 'up' : 'down'} text-xs`} />
              </div>

              {duplicateExpanded && (
                <div className="space-y-2 pt-1 border-t border-amber-500/20">
                  <p className="text-[11px] text-amber-800 m-0 leading-relaxed">
                    A matching ticket is already in progress. Review before submitting to avoid duplicate workload.
                  </p>
                  {candidateList.map((cand, idx) => {
                    const candId = cand.ticket_id || cand.id || `cand-${idx}`;
                    return (
                      <div
                        key={candId}
                        className="p-2.5 rounded-xl bg-app-background border border-amber-500/25 space-y-1 shadow-xs"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold text-brand-primary truncate">
                            #{cand.ticket_number || `TK-${candId.slice(0, 8)}`}
                          </span>
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-amber-500/20 text-amber-900 uppercase">
                            {cand.status}
                          </span>
                        </div>
                        <div className="text-[11px] text-brand-primary font-medium truncate">
                          {cand.title}
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-brand-secondary pt-0.5">
                          <span>{cand.category_name || 'General'}</span>
                          {cand.similarity_score !== undefined && (
                            <span className="font-semibold text-amber-800">
                              {Math.round(cand.similarity_score * 100)}% match
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })()}

        {/* Live Knowledge Base Suggestions */}
        {suggestedKb && suggestedKb.length > 0 && (
          <div className="p-3.5 rounded-2xl bg-brand-secondary/15 border border-brand-secondary/30 text-xs space-y-2">
            <div
              role="button"
              tabIndex={0}
              onClick={() => setKbExpanded(!kbExpanded)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setKbExpanded(!kbExpanded);
                }
              }}
              className="flex items-center justify-between font-bold text-brand-primary cursor-pointer select-none"
            >
              <div className="flex items-center gap-1.5">
                <i className="bi bi-lightbulb text-brand-primary" />
                <span>Helpful Knowledge Articles ({suggestedKb.length})</span>
              </div>
              <i className={`bi bi-chevron-${kbExpanded ? 'up' : 'down'} text-xs`} />
            </div>

            {kbExpanded && (
              <div className="space-y-2 pt-1 border-t border-brand-primary/10">
                <p className="text-[11px] text-brand-secondary m-0">
                  Instant resolution may already be documented:
                </p>
                {suggestedKb.map((art, idx) => {
                  const artId = art.article_id || art.id || art.chunk_id || `art-${idx}`;
                  const artTitle = art.article_title || art.title || 'Knowledge Base Guide';
                  return (
                    <div
                      key={artId}
                      className="p-2.5 rounded-xl bg-app-background border border-brand-primary/10 space-y-1 hover:border-brand-primary/30 transition-colors shadow-xs"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <h5 className="font-bold text-brand-primary text-xs m-0 leading-snug truncate">
                          {artTitle}
                        </h5>
                        {art.similarity_score !== undefined && (
                          <span className="text-[10px] font-semibold text-brand-secondary whitespace-nowrap">
                            {Math.round(art.similarity_score * 100)}% match
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-brand-secondary line-clamp-2 m-0 leading-relaxed">
                        {art.content}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Validation Errors Notice */}
        {validationErrors.length > 0 && (
          <div className="p-3 rounded-2xl bg-red-500/10 border border-red-500/30 text-xs text-red-700 space-y-1">
            <div className="font-bold flex items-center gap-1.5">
              <i className="bi bi-shield-x" />
              <span>Please resolve before submitting:</span>
            </div>
            <ul className="list-disc list-inside space-y-0.5 text-[11px] m-0 pl-1">
              {validationErrors.map((err, i) => (
                <li key={i}>{err}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Submit Ticket Action */}
        <div className="space-y-2 pt-2">
          <button
            type="button"
            disabled={!isFormValid || submitting}
            onClick={onSubmitTicket}
            className={`w-full py-3.5 px-4 rounded-2xl font-bold text-sm transition-all duration-200 flex items-center justify-center gap-2 shadow-subtle ${
              isFormValid && !submitting
                ? 'bg-brand-primary hover:bg-brand-primary/90 text-white shadow-brand-primary/30 cursor-pointer scale-[1.01]'
                : 'bg-brand-primary/40 text-white/70 cursor-not-allowed'
            }`}
          >
            {submitting ? (
              <>
                <i className="bi bi-arrow-repeat animate-spin text-base" />
                <span>Submitting Ticket...</span>
              </>
            ) : (
              <>
                <i className="bi bi-send-fill text-sm" />
                <span>Submit Ticket</span>
              </>
            )}
          </button>

          {/* Draft Actions */}
          <div className="flex items-center justify-between gap-2 pt-1 text-xs">
            <button
              type="button"
              onClick={onSaveDraftManual}
              disabled={isSavingDraft || (!title && !description)}
              className="text-brand-primary hover:text-brand-primary/80 font-semibold px-2 py-1 rounded-lg hover:bg-brand-secondary/15 transition-colors disabled:opacity-40 disabled:pointer-events-none flex items-center gap-1"
            >
              <i className="bi bi-save" /> Save Draft
            </button>
            <button
              type="button"
              onClick={onDiscardDraft}
              className="text-red-600 hover:text-red-700 font-semibold px-2 py-1 rounded-lg hover:bg-red-500/10 transition-colors flex items-center gap-1"
            >
              <i className="bi bi-trash3" /> Discard
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
};
