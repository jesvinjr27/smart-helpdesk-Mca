import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import {
  createTicketApi,
  uploadTicketAttachmentsApi,
  checkDuplicateTicketApi,
  getCategoriesApi,
  searchKnowledgeApi,
} from '../../api';
import { PageHeader } from '../../components/common/PageHeader';
import { CreateTicketProgressStepper } from './components/CreateTicketProgressStepper';
import { Step1DescribeIssue } from './components/Step1DescribeIssue';
import { Step2ClassifyRequest } from './components/Step2ClassifyRequest';
import { Step3ReviewSubmit } from './components/Step3ReviewSubmit';

const DRAFT_STORAGE_PREFIX = 'smart_helpdesk_ticket_draft_';

export const TicketCreatePage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const draftKey = `${DRAFT_STORAGE_PREFIX}${user?.id || 'guest'}`;

  // Step Management
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState([]);

  // Form Fields
  const [issueType, setIssueType] = useState('INCIDENT');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [files, setFiles] = useState([]);
  const [fileError, setFileError] = useState('');

  const [categories, setCategories] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [dynamicData, setDynamicData] = useState({});
  const [priority, setPriority] = useState('MEDIUM');
  const [tagsInput, setTagsInput] = useState('');

  // Status & Errors
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [draftBannerDismissed, setDraftBannerDismissed] = useState(false);
  const [hasExistingDraft, setHasExistingDraft] = useState(false);

  // AI Live Copilot & Duplicate Detection
  const [suggestedKb, setSuggestedKb] = useState([]);
  const [aiSearching, setAiSearching] = useState(false);
  const [criticalNotice, setCriticalNotice] = useState(false);
  const [duplicateCheckLoading, setDuplicateCheckLoading] = useState(false);
  const [duplicateResults, setDuplicateResults] = useState(null);

  // 1. Load Categories
  useEffect(() => {
    const fetchCats = async () => {
      try {
        const resp = await getCategoriesApi();
        setCategories(resp.data || []);
        if (resp.data?.length > 0 && !selectedCategoryId) {
          setSelectedCategoryId(resp.data[0].id);
        }
      } catch (err) {
        console.error('Failed to load categories:', err);
      }
    };
    fetchCats();
  }, []);

  // 2. Check for Saved Local Draft on Mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(draftKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.title || parsed.description) {
          setHasExistingDraft(true);
        }
      }
    } catch (e) {
      // Ignore JSON parse errors
    }
  }, [draftKey]);

  // Restore Draft Handler
  const handleRestoreDraft = () => {
    try {
      const saved = localStorage.getItem(draftKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.issueType) setIssueType(parsed.issueType);
        if (parsed.title) setTitle(parsed.title);
        if (parsed.description) setDescription(parsed.description);
        if (parsed.selectedCategoryId) setSelectedCategoryId(parsed.selectedCategoryId);
        if (parsed.priority) setPriority(parsed.priority);
        if (parsed.tagsInput) setTagsInput(parsed.tagsInput);
        if (parsed.dynamicData) setDynamicData(parsed.dynamicData);
      }
    } catch (e) {
      console.error('Failed to restore draft:', e);
    }
    setHasExistingDraft(false);
    setDraftBannerDismissed(true);
  };

  const handleDiscardSavedDraft = () => {
    localStorage.removeItem(draftKey);
    setHasExistingDraft(false);
    setDraftBannerDismissed(true);
  };

  // 3. Debounced Auto-Save Draft
  useEffect(() => {
    if (!title && !description) return;
    const timer = setTimeout(() => {
      const draftObj = {
        issueType,
        title,
        description,
        selectedCategoryId,
        priority,
        tagsInput,
        dynamicData,
        savedAt: new Date().toISOString(),
      };
      localStorage.setItem(draftKey, JSON.stringify(draftObj));
    }, 800);

    return () => clearTimeout(timer);
  }, [issueType, title, description, selectedCategoryId, priority, tagsInput, dynamicData, draftKey]);

  // 4. Emergency Detection & Live Semantic Knowledge Suggestions
  useEffect(() => {
    if (!title && !description) {
      setSuggestedKb([]);
      setCriticalNotice(false);
      return;
    }

    const lower = `${title} ${description}`.toLowerCase();
    const isEmergency = ['server down', 'outage', 'data loss', 'security breach', 'fire', 'leakage', 'work stoppage'].some(
      (kw) => lower.includes(kw)
    );
    if (isEmergency) {
      setCriticalNotice(true);
      setPriority('CRITICAL');
    } else {
      setCriticalNotice(false);
    }

    const timer = setTimeout(async () => {
      if (title.length > 5 || description.length > 10) {
        setAiSearching(true);
        try {
          const resp = await searchKnowledgeApi({
            query: `${title} ${description}`,
            top_k: 2,
          });
          setSuggestedKb(resp.data?.results || []);
        } catch (e) {
          // Ignore
        } finally {
          setAiSearching(false);
        }
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [title, description]);

  // Step 1 -> Step 2
  const handleNextFromStep1 = () => {
    if (title.trim().length >= 3 && description.trim().length >= 5) {
      setCompletedSteps((prev) => Array.from(new Set([...prev, 1])));
      setCurrentStep(2);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Step 2 -> Step 3 (Runs Duplicate Detection)
  const handleNextFromStep2 = async () => {
    if (selectedCategoryId) {
      setCompletedSteps((prev) => Array.from(new Set([...prev, 1, 2])));
      setCurrentStep(3);
      window.scrollTo({ top: 0, behavior: 'smooth' });

      // Run duplicate check in the background
      setDuplicateCheckLoading(true);
      try {
        const dupResp = await checkDuplicateTicketApi({
          title: title.trim(),
          description: description.trim(),
          category_id: selectedCategoryId,
        });
        setDuplicateResults(dupResp.data);
      } catch (err) {
        console.error('Duplicate check skipped:', err);
      } finally {
        setDuplicateCheckLoading(false);
      }
    }
  };

  // Clear Entire Draft
  const handleClearDraft = () => {
    if (window.confirm('Are you sure you want to discard your progress and clear this draft?')) {
      localStorage.removeItem(draftKey);
      setTitle('');
      setDescription('');
      setFiles([]);
      setDynamicData({});
      setPriority('MEDIUM');
      setTagsInput('');
      setCurrentStep(1);
      setCompletedSteps([]);
      setSuggestedKb([]);
      setDuplicateResults(null);
    }
  };

  // Final Submission
  const handleSubmitTicket = async () => {
    setErrorMessage('');
    setSubmitting(true);

    // Build synthesized description with contextual dynamic fields
    let finalDescription = description.trim();
    const dynamicEntries = Object.entries(dynamicData).filter(([k, v]) => Boolean(v) && k !== 'subcategory');

    if (dynamicData.subcategory || dynamicEntries.length > 0) {
      finalDescription += '\n\n---\n**Structured Ticket Specifications:**';
      if (dynamicData.subcategory) {
        finalDescription += `\n• Area / Subcategory: ${dynamicData.subcategory}`;
      }
      dynamicEntries.forEach(([k, v]) => {
        const formattedKey = k.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase());
        finalDescription += `\n• ${formattedKey}: ${v}`;
      });
    }

    // Build tags
    const userTags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    const consolidatedTags = Array.from(
      new Set([
        issueType.toLowerCase(),
        ...(dynamicData.subcategory ? [dynamicData.subcategory.toLowerCase()] : []),
        ...userTags,
      ])
    );

    try {
      // 1. Create Ticket
      const ticketResp = await createTicketApi({
        title: title.trim(),
        description: finalDescription,
        category_id: selectedCategoryId,
        priority,
        tags: consolidatedTags,
      });

      const newTicketId = ticketResp.data.id;

      // 2. Upload Attachments if any
      if (files.length > 0) {
        try {
          const formData = new FormData();
          files.forEach((file) => {
            formData.append('files', file);
          });
          await uploadTicketAttachmentsApi(newTicketId, formData);
        } catch (uploadErr) {
          console.error('Attachments upload failed, ticket created:', uploadErr);
        }
      }

      // 3. Clear Local Draft
      localStorage.removeItem(draftKey);

      // 4. Navigate to new ticket detail page
      navigate(`/tickets/${newTicketId}`);
    } catch (err) {
      setErrorMessage(err.response?.data?.detail || 'Failed to submit ticket incident. Please check fields.');
      setSubmitting(false);
    }
  };

  const selectedCategory = categories.find((c) => c.id === selectedCategoryId) || categories[0];

  return (
    <div className="w-full max-w-full min-w-0 space-y-6">
      <PageHeader
        title="Create Support Ticket"
        subtitle="Report an incident or service request. Our local intelligence engine classifies, prioritizes, and routes your ticket with zero cloud leakage."
        breadcrumbs={[
          { label: 'Dashboard', link: '/dashboard' },
          { label: 'Tickets', link: '/tickets' },
          { label: 'Create Ticket' },
        ]}
        actions={
          <button
            type="button"
            onClick={() => navigate('/tickets')}
            className="px-3.5 py-1.5 rounded-xl border border-brand-primary/20 bg-app-background text-brand-primary hover:bg-brand-secondary/15 text-xs sm:text-sm font-medium transition-colors inline-flex items-center gap-1.5"
          >
            <i className="bi bi-x-lg text-xs" />
            <span>Cancel</span>
          </button>
        }
      />

      {/* Draft Resume Banner */}
      {hasExistingDraft && !draftBannerDismissed && (
        <div className="p-4 rounded-2xl bg-brand-secondary/20 border border-brand-secondary/40 flex flex-wrap items-center justify-between gap-3 shadow-subtle animate-scaleUp">
          <div className="flex items-center gap-2.5">
            <i className="bi bi-clock-history text-lg text-brand-primary flex-shrink-0" />
            <div>
              <h4 className="font-bold text-xs sm:text-sm text-brand-primary m-0">
                You have an unsaved ticket draft
              </h4>
              <p className="text-xs text-brand-secondary m-0 mt-0.5">
                Would you like to restore your previous entries or start fresh?
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleRestoreDraft}
              className="px-3 py-1.5 rounded-xl bg-brand-primary text-white text-xs font-semibold hover:bg-brand-primary/90 transition-colors shadow-sm"
            >
              Resume Draft
            </button>
            <button
              type="button"
              onClick={handleDiscardSavedDraft}
              className="px-3 py-1.5 rounded-xl border border-brand-primary/30 text-brand-primary text-xs font-medium hover:bg-brand-secondary/15 transition-colors"
            >
              Discard
            </button>
          </div>
        </div>
      )}

      {/* Global Error Banner */}
      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-brand-primary/10 border border-brand-primary/30 flex items-start gap-2.5 text-xs text-brand-primary">
          <i className="bi bi-exclamation-octagon-fill text-brand-primary text-base flex-shrink-0 mt-0.5" />
          <span className="leading-relaxed">{errorMessage}</span>
        </div>
      )}

      {/* 3-Step Progress Stepper */}
      <CreateTicketProgressStepper
        currentStep={currentStep}
        setStep={setCurrentStep}
        completedSteps={completedSteps}
      />

      {/* Main Form Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Interactive Step Workspace (68% width) */}
        <div className="lg:col-span-8">
          {currentStep === 1 && (
            <Step1DescribeIssue
              issueType={issueType}
              setIssueType={setIssueType}
              title={title}
              setTitle={setTitle}
              description={description}
              setDescription={setDescription}
              files={files}
              setFiles={setFiles}
              fileError={fileError}
              setFileError={setFileError}
              onNext={handleNextFromStep1}
            />
          )}

          {currentStep === 2 && (
            <Step2ClassifyRequest
              categories={categories}
              selectedCategoryId={selectedCategoryId}
              setSelectedCategoryId={setSelectedCategoryId}
              dynamicData={dynamicData}
              setDynamicData={setDynamicData}
              priority={priority}
              setPriority={setPriority}
              criticalNotice={criticalNotice}
              tagsInput={tagsInput}
              setTagsInput={setTagsInput}
              onBack={() => setCurrentStep(1)}
              onNext={handleNextFromStep2}
            />
          )}

          {currentStep === 3 && (
            <Step3ReviewSubmit
              issueType={issueType}
              title={title}
              description={description}
              files={files}
              selectedCategory={selectedCategory}
              dynamicData={dynamicData}
              priority={priority}
              tags={tagsInput.split(',').map((t) => t.trim()).filter(Boolean)}
              duplicateCheckLoading={duplicateCheckLoading}
              duplicateResults={duplicateResults}
              submitting={submitting}
              onBack={() => setCurrentStep(2)}
              onGoToStep={(s) => setCurrentStep(s)}
              onClearDraft={handleClearDraft}
              onSubmit={handleSubmitTicket}
            />
          )}
        </div>

        {/* Right Column: AI Live Copilot & Contextual Sidebar (32% width) */}
        <div className="lg:col-span-4 space-y-5">
          {/* Emergency Alert Card */}
          {criticalNotice && (
            <div className="p-4 rounded-2xl bg-brand-primary/10 border border-brand-primary/30 shadow-subtle animate-scaleUp">
              <div className="flex items-start gap-3">
                <i className="bi bi-exclamation-octagon-fill text-xl text-brand-primary flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-sm text-brand-primary mb-1">
                    Critical Emergency Detected
                  </h4>
                  <p className="text-xs text-brand-secondary leading-relaxed m-0">
                    Your description matches critical system failure keywords. Ticket priority has been elevated to <b>CRITICAL</b> with an expedited 1-hour resolution commitment.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* AI Knowledge Base Live Solution Card */}
          <div className="card-glow p-5 sm:p-6 rounded-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-brand-primary/15">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-brand-secondary/20 text-brand-primary flex items-center justify-center flex-shrink-0">
                  <i className="bi bi-stars" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-brand-primary m-0">
                    Instant AI Self-Service
                  </h3>
                  <span className="text-[10px] text-brand-secondary">Semantic RAG Engine</span>
                </div>
              </div>
              {aiSearching && (
                <span className="w-4 h-4 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
              )}
            </div>

            <p className="text-xs text-brand-secondary leading-relaxed m-0">
              As you describe your issue, our local AI searches verified troubleshooting articles to resolve your problem immediately without waiting in queue.
            </p>

            {suggestedKb.length === 0 ? (
              <div className="text-center py-6 text-brand-secondary">
                <div className="w-10 h-10 mx-auto rounded-full bg-brand-secondary/15 flex items-center justify-center mb-2 text-lg text-brand-primary">
                  <i className="bi bi-lightbulb" />
                </div>
                <p className="text-xs max-w-xs mx-auto m-0">
                  Type a descriptive subject to see verified solutions and self-service guides.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {suggestedKb.map((kb) => (
                  <div
                    key={kb.chunk_id}
                    className="p-3.5 rounded-xl card-glow-interactive space-y-1.5"
                  >
                    <div className="flex items-center justify-between gap-1.5">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-brand-secondary/20 text-brand-primary border border-brand-secondary/35">
                        <i className="bi bi-check2-circle text-xs" />
                        <span>Match: {Math.round(kb.similarity_score * 100)}%</span>
                      </span>
                      <span className="text-[10px] text-brand-secondary font-mono">
                        #{kb.chunk_id.slice(0, 8)}
                      </span>
                    </div>
                    <h4 className="font-bold text-xs text-brand-primary m-0">
                      {kb.article_title}
                    </h4>
                    <p className="text-xs text-brand-secondary line-clamp-2 leading-relaxed m-0">
                      {kb.content}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* SLA Policies & Helpful Guidelines Card */}
          <div className="card-glow p-5 sm:p-6 rounded-2xl space-y-3">
            <div className="flex items-center gap-2 pb-2.5 border-b border-brand-primary/15">
              <i className="bi bi-info-circle text-brand-primary text-base" />
              <h4 className="font-bold text-xs sm:text-sm text-brand-primary uppercase tracking-wider m-0">
                Help Desk Guidelines
              </h4>
            </div>

            <ul className="text-xs text-brand-secondary space-y-2 leading-relaxed list-none p-0 m-0">
              <li className="flex items-start gap-2">
                <i className="bi bi-check2 text-brand-primary text-sm flex-shrink-0 mt-0.5" />
                <span><b>Be specific:</b> Include device names, room numbers, or exact error messages.</span>
              </li>
              <li className="flex items-start gap-2">
                <i className="bi bi-check2 text-brand-primary text-sm flex-shrink-0 mt-0.5" />
                <span><b>Screenshots:</b> Visual error captures help technicians resolve issues 40% faster.</span>
              </li>
              <li className="flex items-start gap-2">
                <i className="bi bi-check2 text-brand-primary text-sm flex-shrink-0 mt-0.5" />
                <span><b>SLA Commitments:</b> Critical outages are dispatched within 1 hour; standard requests within 24 hours.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
