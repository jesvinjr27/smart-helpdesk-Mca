import React from 'react';
import { FileDropzone } from './FileDropzone';

const ISSUE_TYPES = [
  { key: 'INCIDENT', title: 'Incident', desc: 'Something is broken or down', icon: 'bi-exclamation-circle' },
  { key: 'REQUEST', title: 'Service Request', desc: 'Request new access or hardware', icon: 'bi-box-seam' },
  { key: 'QUESTION', title: 'Question', desc: 'Inquiry or general IT advice', icon: 'bi-question-circle' },
];

export const Step1DescribeIssue = ({
  issueType,
  setIssueType,
  title,
  setTitle,
  description,
  setDescription,
  files,
  setFiles,
  fileError,
  setFileError,
  onNext,
}) => {
  const insertTemplateSnippet = (snippet) => {
    setDescription((prev) => (prev ? `${prev}\n\n${snippet}` : snippet));
  };

  const isValid = title.trim().length >= 3 && description.trim().length >= 5;

  return (
    <div className="card-glow p-5 sm:p-7 rounded-2xl space-y-6">
      {/* Issue Type Selector */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-brand-primary mb-2">
          Issue Type <span className="text-brand-primary font-bold">*</span>
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {ISSUE_TYPES.map((type) => {
            const isSelected = issueType === type.key;
            return (
              <div
                key={type.key}
                role="button"
                tabIndex={0}
                onClick={() => setIssueType(type.key)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setIssueType(type.key);
                  }
                }}
                className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all duration-200 select-none flex items-center gap-3 ${
                  isSelected
                    ? 'bg-brand-primary text-white border-brand-primary shadow-subtle ring-2 ring-brand-primary/40'
                    : 'bg-app-background border-brand-primary/15 text-brand-primary hover:border-brand-primary/40 hover:bg-brand-secondary/10'
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center text-base flex-shrink-0 ${
                    isSelected ? 'bg-white text-brand-primary shadow-sm' : 'bg-brand-secondary/20 text-brand-primary'
                  }`}
                >
                  <i className={`bi ${type.icon}`} />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="font-bold text-xs sm:text-sm truncate m-0 leading-tight">
                    {type.title}
                  </h4>
                  <p className={`text-[11px] truncate mt-0.5 m-0 ${isSelected ? 'text-white/80' : 'text-brand-secondary'}`}>
                    {type.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Ticket Subject */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="block text-xs font-semibold uppercase tracking-wider text-brand-primary">
            Ticket Subject / Title <span className="text-brand-primary font-bold">*</span>
          </label>
          <span className={`text-[11px] ${title.length > 255 ? 'text-red-600 font-bold' : 'text-brand-secondary'}`}>
            {title.length}/255
          </span>
        </div>
        <input
          type="text"
          required
          minLength={3}
          maxLength={255}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Cannot connect to GlobalProtect VPN from home after password change"
          className="w-full px-4 py-3 text-sm bg-app-background border border-brand-secondary/40 rounded-xl text-brand-primary placeholder:text-brand-secondary/60 focus:outline-none focus:ring-2 focus:ring-brand-accent/40 focus:border-brand-primary transition-colors font-medium"
        />
        <span className="text-brand-secondary text-xs mt-1 block">
          A clear, specific subject helps our team and automated routing system prioritize your ticket faster.
        </span>
      </div>

      {/* Ticket Description */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="block text-xs font-semibold uppercase tracking-wider text-brand-primary">
            Detailed Description <span className="text-brand-primary font-bold">*</span>
          </label>
          <div className="flex items-center gap-1.5 text-[11px] text-brand-secondary">
            <span>Quick formats:</span>
            <button
              type="button"
              onClick={() => insertTemplateSnippet('**Steps to reproduce:**\n1. \n2. \n3. ')}
              className="px-2 py-0.5 rounded bg-brand-secondary/15 hover:bg-brand-secondary/30 text-brand-primary font-medium transition-colors"
            >
              + Steps
            </button>
            <button
              type="button"
              onClick={() => insertTemplateSnippet('**Error details / code:**\n')}
              className="px-2 py-0.5 rounded bg-brand-secondary/15 hover:bg-brand-secondary/30 text-brand-primary font-medium transition-colors"
            >
              + Error Code
            </button>
            <button
              type="button"
              onClick={() => insertTemplateSnippet('**Expected behavior:**\n')}
              className="px-2 py-0.5 rounded bg-brand-secondary/15 hover:bg-brand-secondary/30 text-brand-primary font-medium transition-colors"
            >
              + Expected
            </button>
          </div>
        </div>
        <textarea
          required
          minLength={5}
          rows={6}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Provide complete context: What were you doing? What error message did you receive? Are any other coworkers or students affected?"
          className="w-full px-4 py-3 text-sm bg-app-background border border-brand-secondary/40 rounded-xl text-brand-primary placeholder:text-brand-secondary/60 focus:outline-none focus:ring-2 focus:ring-brand-accent/40 focus:border-brand-primary transition-colors resize-y leading-relaxed"
        />
        <div className="flex items-center justify-between mt-1 text-xs text-brand-secondary">
          <span>Minimum 5 characters required</span>
          <span>{description.trim().split(/\s+/).filter(Boolean).length} words</span>
        </div>
      </div>

      {/* Attachments Dropzone */}
      <FileDropzone
        files={files}
        setFiles={setFiles}
        error={fileError}
        setError={setFileError}
      />

      {/* Action Footer */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-brand-primary/10">
        <button
          type="button"
          disabled={!isValid}
          onClick={onNext}
          className="px-6 py-2.5 rounded-xl bg-brand-primary hover:bg-brand-primary/90 text-white font-semibold text-xs sm:text-sm shadow-subtle transition-all inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span>Continue to Classification</span>
          <i className="bi bi-arrow-right text-xs" />
        </button>
      </div>
    </div>
  );
};
