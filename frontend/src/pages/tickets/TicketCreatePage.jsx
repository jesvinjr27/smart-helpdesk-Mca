import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
import { RequestTypeSelector } from './components/RequestTypeSelector';
import { CategoryCard } from './components/CategoryCard';
import { DynamicCategoryFields } from './components/DynamicCategoryFields';
import {
  ImpactUrgencyMatrix,
  calculatePriority,
  EMERGENCY_REGEX,
} from './components/ImpactUrgencyMatrix';
import { LocationAndContactFields, CAMPUS_BUILDINGS } from './components/LocationAndContactFields';
import { FileDropzone } from './components/FileDropzone';
import { LiveTicketSummaryPanel } from './components/LiveTicketSummaryPanel';
import { TicketSubmissionConfirmation } from './components/TicketSubmissionConfirmation';

const DRAFT_STORAGE_PREFIX = 'smart_helpdesk_ticket_workspace_draft_';

export const TicketCreatePage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const draftKey = `${DRAFT_STORAGE_PREFIX}${user?.id || 'guest'}`;

  // Form States
  const [requestType, setRequestType] = useState('INCIDENT');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tagsInput, setTagsInput] = useState('');

  // Categories & Subcategory Dynamic Data
  const [categories, setCategories] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [dynamicData, setDynamicData] = useState({});

  // Impact & Urgency Matrix
  const [impact, setImpact] = useState('ONLY_ME');
  const [urgency, setUrgency] = useState('NORMAL');
  const [isOverride, setIsOverride] = useState(false);
  const [overridePriority, setOverridePriority] = useState('HIGH');
  const [overrideReason, setOverrideReason] = useState('');

  // Location & Contact Context
  const [locationData, setLocationData] = useState({
    building: CAMPUS_BUILDINGS[0],
    roomNumber: '',
    contactMethod: 'EMAIL',
    contactDetail: user?.email || '',
    affectedService: '',
  });

  // Attachments
  const [files, setFiles] = useState([]);
  const [fileError, setFileError] = useState('');

  // Status & Draft Management
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [hasExistingDraft, setHasExistingDraft] = useState(false);
  const [draftBannerDismissed, setDraftBannerDismissed] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState(null);
  const [isSavingDraft, setIsSavingDraft] = useState(false);

  // Intelligent Suggestions & Duplicate Prevention
  const [suggestedKb, setSuggestedKb] = useState([]);
  const [kbLoading, setKbLoading] = useState(false);
  const [duplicateResults, setDuplicateResults] = useState(null);
  const [duplicateLoading, setDuplicateLoading] = useState(false);

  // Submission Result
  const [submittedTicket, setSubmittedTicket] = useState(null);

  // 1. Fetch Categories
  useEffect(() => {
    let isMounted = true;
    const fetchCategories = async () => {
      try {
        const resp = await getCategoriesApi();
        if (isMounted) {
          const list = resp.data || [];
          setCategories(list);
          if (list.length > 0 && !selectedCategoryId) {
            setSelectedCategoryId(list[0].id);
          }
        }
      } catch (err) {
        console.error('Failed to load categories:', err);
      }
    };
    fetchCategories();
    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Check for Saved Local Draft on Mount & When Auth Loads
  useEffect(() => {
    try {
      let saved = localStorage.getItem(draftKey);
      if (!saved && user?.id) {
        // Check if draft was started before auth loaded
        saved = localStorage.getItem(`${DRAFT_STORAGE_PREFIX}guest`);
      }
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.title || parsed.description) {
          setHasExistingDraft(true);
          if (parsed.savedAt) {
            setLastSavedAt(new Date(parsed.savedAt));
          }
        }
      }
    } catch (e) {
      // Ignore JSON parse errors
    }
  }, [draftKey, user?.id]);

  // Restore Draft Action
  const handleRestoreDraft = () => {
    try {
      let saved = localStorage.getItem(draftKey);
      if (!saved && user?.id) {
        saved = localStorage.getItem(`${DRAFT_STORAGE_PREFIX}guest`);
      }
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.requestType) setRequestType(parsed.requestType);
        if (parsed.title) setTitle(parsed.title);
        if (parsed.description) setDescription(parsed.description);
        if (parsed.selectedCategoryId) setSelectedCategoryId(parsed.selectedCategoryId);
        if (parsed.dynamicData) setDynamicData(parsed.dynamicData);
        if (parsed.impact) setImpact(parsed.impact);
        if (parsed.urgency) setUrgency(parsed.urgency);
        if (parsed.isOverride !== undefined) setIsOverride(parsed.isOverride);
        if (parsed.overridePriority) setOverridePriority(parsed.overridePriority);
        if (parsed.overrideReason) setOverrideReason(parsed.overrideReason);
        if (parsed.locationData) setLocationData(parsed.locationData);
        if (parsed.tagsInput) setTagsInput(parsed.tagsInput);
        if (parsed.savedAt) setLastSavedAt(new Date(parsed.savedAt));
      }
    } catch (e) {
      console.error('Failed to restore draft:', e);
    }
    setHasExistingDraft(false);
    setDraftBannerDismissed(true);
  };

  const handleDiscardSavedDraft = () => {
    localStorage.removeItem(draftKey);
    if (user?.id) localStorage.removeItem(`${DRAFT_STORAGE_PREFIX}guest`);
    setHasExistingDraft(false);
    setDraftBannerDismissed(true);
    setLastSavedAt(null);
  };

  // 3. Debounced Auto-Save Draft to LocalStorage
  const saveDraftToStorage = useCallback(() => {
    if (!title && !description) return;
    setIsSavingDraft(true);
    const draftObj = {
      requestType,
      title,
      description,
      selectedCategoryId,
      dynamicData,
      impact,
      urgency,
      isOverride,
      overridePriority,
      overrideReason,
      locationData,
      tagsInput,
      savedAt: new Date().toISOString(),
    };
    try {
      localStorage.setItem(draftKey, JSON.stringify(draftObj));
      setLastSavedAt(new Date());
    } catch (e) {
      console.warn('Failed to save draft to localStorage:', e);
    } finally {
      setTimeout(() => setIsSavingDraft(false), 300);
    }
  }, [
    requestType,
    title,
    description,
    selectedCategoryId,
    dynamicData,
    impact,
    urgency,
    isOverride,
    overridePriority,
    overrideReason,
    locationData,
    tagsInput,
    draftKey,
  ]);

  useEffect(() => {
    // Only auto-save if user entered content and we are not blocking on un-restored draft
    if ((!title && !description) || (hasExistingDraft && !draftBannerDismissed)) return;
    const timer = setTimeout(() => {
      saveDraftToStorage();
    }, 800);
    return () => clearTimeout(timer);
  }, [saveDraftToStorage, title, description, hasExistingDraft, draftBannerDismissed]);

  // Clear / Discard Draft
  const handleClearDraft = () => {
    if (window.confirm('Are you sure you want to discard your changes and start a fresh ticket?')) {
      localStorage.removeItem(draftKey);
      if (user?.id) localStorage.removeItem(`${DRAFT_STORAGE_PREFIX}guest`);
      setTitle('');
      setDescription('');
      setFiles([]);
      setFileError('');
      setDynamicData({});
      setImpact('ONLY_ME');
      setUrgency('NORMAL');
      setIsOverride(false);
      setOverridePriority('HIGH');
      setOverrideReason('');
      setTagsInput('');
      setSuggestedKb([]);
      setDuplicateResults(null);
      setLastSavedAt(null);
      setErrorMessage('');
      setHasExistingDraft(false);
      setDraftBannerDismissed(true);
    }
  };

  // 4. Calculate Priority & Active Priority
  const hasEmergency = useMemo(() => {
    return EMERGENCY_REGEX.test(title) || EMERGENCY_REGEX.test(description);
  }, [title, description]);

  const computedPriorityObj = useMemo(() => {
    return calculatePriority(impact, urgency, hasEmergency);
  }, [impact, urgency, hasEmergency]);

  const activePriority = isOverride && !hasEmergency ? overridePriority : computedPriorityObj.priority;

  // 5. Intelligent Debounced Search for Knowledge Base & Duplicate Tickets
  useEffect(() => {
    const trimmedTitle = title.trim();
    const trimmedDesc = description.trim();

    // Reset results if both are too short
    if (trimmedTitle.length < 3 && trimmedDesc.length < 5) {
      setSuggestedKb([]);
      setDuplicateResults(null);
      return;
    }

    const timer = setTimeout(async () => {
      const queryText = `${trimmedTitle} ${trimmedDesc}`.trim();

      // 1. Search Knowledge Base (triggers once query has at least 3 chars)
      if (queryText.length >= 3) {
        setKbLoading(true);
        try {
          const kbResp = await searchKnowledgeApi({
            query: queryText,
            top_k: 3,
          });
          setSuggestedKb(kbResp.data?.results || []);
        } catch (e) {
          // Non-blocking
        } finally {
          setKbLoading(false);
        }
      }

      // 2. Check Duplicates (triggers as soon as title has at least 3 chars)
      if (trimmedTitle.length >= 3) {
        setDuplicateLoading(true);
        try {
          const dupResp = await checkDuplicateTicketApi({
            title: trimmedTitle,
            description: trimmedDesc || trimmedTitle,
            category_id: selectedCategoryId || undefined,
          });
          setDuplicateResults(dupResp.data);
        } catch (e) {
          // Non-blocking
        } finally {
          setDuplicateLoading(false);
        }
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [title, description, selectedCategoryId]);

  // 6. Formatting Snippet Helper Injection
  const handleInsertSnippet = (snippet) => {
    setDescription((prev) => {
      const separator = prev.trim() ? '\n\n' : '';
      return `${prev.trim()}${separator}${snippet}\n`;
    });
  };

  // 7. Validation
  const validationErrors = useMemo(() => {
    const errors = [];
    if (!title.trim() || title.trim().length < 3) {
      errors.push('Subject must be at least 3 characters long.');
    }
    if (title.length > 255) {
      errors.push('Subject must not exceed 255 characters.');
    }
    if (!description.trim() || description.trim().length < 5) {
      errors.push('Detailed description must be at least 5 characters long.');
    }
    if (!selectedCategoryId) {
      errors.push('Please select a category for this request.');
    }
    if (isOverride && !hasEmergency && !overrideReason.trim()) {
      errors.push('Please enter a justification for your priority override.');
    }
    return errors;
  }, [title, description, selectedCategoryId, isOverride, hasEmergency, overrideReason]);

  // 8. Submit Ticket
  const handleSubmitTicket = async () => {
    if (validationErrors.length > 0) {
      setErrorMessage(validationErrors[0]);
      return;
    }

    setErrorMessage('');
    setSubmitting(true);

    try {
      // Build Synthesized Structured Description
      let finalDescription = description.trim();

      // Append Structured Specifications
      const dynamicEntries = Object.entries(dynamicData).filter(
        ([k, v]) => Boolean(v) && k !== 'subcategory'
      );
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

      // Append Location & Contact Context if entered
      if (locationData.building || locationData.roomNumber || locationData.contactDetail || locationData.affectedService) {
        finalDescription += '\n\n---\n**Location, Contact & System Context:**';
        if (locationData.building) finalDescription += `\n• Facility: ${locationData.building}`;
        if (locationData.roomNumber) finalDescription += `\n• Room / Desk: ${locationData.roomNumber}`;
        if (locationData.contactMethod) finalDescription += `\n• Preferred Channel: ${locationData.contactMethod}`;
        if (locationData.contactDetail) finalDescription += `\n• Contact Identifier: ${locationData.contactDetail}`;
        if (locationData.affectedService) finalDescription += `\n• Affected System: ${locationData.affectedService}`;
      }

      // Append Override Justification if provided
      if (isOverride && overrideReason) {
        finalDescription += `\n\n---\n**Priority Override Request:**\n• Justification: ${overrideReason}`;
      }

      // Consolidate Tags
      const customTags = tagsInput
        .split(',')
        .map((t) => t.trim())
        .filter((t) => t.length > 0);

      const consolidatedTags = Array.from(
        new Set([
          requestType.toLowerCase(),
          ...(dynamicData.subcategory ? [dynamicData.subcategory.toLowerCase()] : []),
          ...customTags,
        ])
      );

      // 1. Create Ticket via API
      const ticketResp = await createTicketApi({
        title: title.trim(),
        description: finalDescription,
        category_id: selectedCategoryId,
        priority: activePriority,
        tags: consolidatedTags,
      });

      const newTicket = ticketResp.data;

      // 2. Upload Attachments if any
      if (files.length > 0) {
        try {
          const formData = new FormData();
          files.forEach((file) => {
            formData.append('files', file);
          });
          await uploadTicketAttachmentsApi(newTicket.id, formData);
        } catch (uploadErr) {
          console.error('Attachments upload failed, ticket was created:', uploadErr);
        }
      }

      // 3. Clear LocalStorage Draft
      localStorage.removeItem(draftKey);

      // 4. Set Confirmation View
      setSubmittedTicket(newTicket);
    } catch (err) {
      console.error('Submission failed:', err);
      setErrorMessage(err.response?.data?.detail || 'Failed to submit support ticket. Please verify inputs.');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedCategoryObj = categories.find((c) => c.id === selectedCategoryId) || categories[0];

  // If Ticket Submitted Successfully, Show Confirmation Screen
  if (submittedTicket) {
    return (
      <TicketSubmissionConfirmation
        ticket={submittedTicket}
        requestType={requestType}
        categoryName={selectedCategoryObj?.name || 'General'}
        subcategory={dynamicData?.subcategory || 'General'}
        priority={activePriority}
        slaTarget={computedPriorityObj.sla}
        locationData={locationData}
        onViewTicket={() => navigate(`/tickets/${submittedTicket.id}`)}
        onBackToDashboard={() => navigate('/dashboard')}
        onCreateAnother={() => {
          setSubmittedTicket(null);
          setTitle('');
          setDescription('');
          setFiles([]);
          setDynamicData({});
          setImpact('ONLY_ME');
          setUrgency('NORMAL');
          setIsOverride(false);
          setOverrideReason('');
          setTagsInput('');
          setSuggestedKb([]);
          setDuplicateResults(null);
          setLastSavedAt(null);
        }}
      />
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <PageHeader
        title="Smart Ticket Creation Workspace"
        subtitle="Enterprise ITSM incident logging and service requests with real-time ITIL priority calculation and zero cloud data leakage."
        breadcrumbs={[
          { label: 'Dashboard', link: '/dashboard' },
          { label: 'Tickets', link: '/tickets' },
          { label: 'Create Ticket' },
        ]}
        actions={
          <button
            type="button"
            onClick={() => navigate('/tickets')}
            className="px-3.5 py-1.5 rounded-xl border border-brand-primary/20 bg-app-background text-brand-primary hover:bg-brand-secondary/15 text-xs sm:text-sm font-medium transition-colors inline-flex items-center gap-1.5 cursor-pointer"
          >
            <i className="bi bi-x-lg text-xs" />
            <span>Cancel</span>
          </button>
        }
      />

      {/* Unsaved Draft Banner */}
      {hasExistingDraft && !draftBannerDismissed && (
        <div className="p-4 rounded-2xl bg-brand-secondary/20 border border-brand-secondary/40 flex flex-wrap items-center justify-between gap-3 shadow-subtle animate-scaleUp">
          <div className="flex items-center gap-3">
            <i className="bi bi-clock-history text-xl text-brand-primary flex-shrink-0" />
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
              className="px-3.5 py-1.5 rounded-xl bg-brand-primary text-white text-xs font-semibold hover:bg-brand-primary/90 transition-colors shadow-sm cursor-pointer"
            >
              Restore Draft
            </button>
            <button
              type="button"
              onClick={handleDiscardSavedDraft}
              className="px-3.5 py-1.5 rounded-xl bg-app-background border border-brand-primary/20 text-brand-primary text-xs font-semibold hover:bg-red-500/10 hover:text-red-600 transition-colors cursor-pointer"
            >
              Discard
            </button>
          </div>
        </div>
      )}

      {/* Main Single-Page Workspace Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Interactive Form Canvas */}
        <div className="lg:col-span-8 space-y-6">
          {/* Section 1: Request Type Selection */}
          <div className="bg-app-background border border-brand-primary/15 rounded-3xl p-5 sm:p-6 shadow-subtle space-y-4">
            <RequestTypeSelector
              selectedType={requestType}
              onSelect={(type) => setRequestType(type)}
            />
          </div>

          {/* Section 2: Request Information (Subject, Description, Snippets) */}
          <div id="request-info" className="bg-app-background border border-brand-primary/15 rounded-3xl p-5 sm:p-6 shadow-subtle space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-brand-primary">
                  Step 2: Describe Your Request or Incident <span className="text-brand-primary font-bold">*</span>
                </label>
                <p className="text-[11px] text-brand-secondary m-0 mt-0.5">
                  Provide a concise summary and detailed context
                </p>
              </div>
            </div>

            {/* Subject Field */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-brand-primary">
                  Ticket Subject / Title <span className="text-brand-primary font-bold">*</span>
                </label>
                <span className={`text-[11px] ${title.length > 255 ? 'text-red-500 font-bold' : 'text-brand-secondary'}`}>
                  {title.length}/255
                </span>
              </div>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={255}
                placeholder="e.g. Wi-Fi disconnection in Library 3rd Floor, or Unable to install MATLAB"
                className="w-full px-4 py-3 text-xs sm:text-sm bg-app-background border border-brand-secondary/40 rounded-2xl text-brand-primary placeholder:text-brand-secondary/60 focus:outline-none focus:ring-2 focus:ring-brand-accent/40 focus:border-brand-primary transition-all font-medium"
              />
            </div>

            {/* Description Field */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-brand-primary">
                  Detailed Description <span className="text-brand-primary font-bold">*</span>
                </label>
                <span className="text-[11px] text-brand-secondary">
                  {description.trim().length} chars {description.trim().length < 5 && '(min 5)'}
                </span>
              </div>

              {/* Formatting Helper Snippets */}
              <div className="flex flex-wrap items-center gap-1.5 pb-1">
                <span className="text-[10px] text-brand-secondary font-semibold uppercase tracking-wider mr-1">
                  Insert Template:
                </span>
                <button
                  type="button"
                  onClick={() => handleInsertSnippet('**Steps to Reproduce:**\n1. \n2. \n3. ')}
                  className="px-2 py-1 text-[11px] font-medium rounded-lg bg-brand-secondary/15 hover:bg-brand-secondary/30 text-brand-primary transition-colors cursor-pointer"
                >
                  + Steps to Reproduce
                </button>
                <button
                  type="button"
                  onClick={() => handleInsertSnippet('**Expected Behavior:** \n**Actual Behavior:** ')}
                  className="px-2 py-1 text-[11px] font-medium rounded-lg bg-brand-secondary/15 hover:bg-brand-secondary/30 text-brand-primary transition-colors cursor-pointer"
                >
                  + Expected vs Actual
                </button>
                <button
                  type="button"
                  onClick={() => handleInsertSnippet('**Error Message / Code:** \n```\n\n```')}
                  className="px-2 py-1 text-[11px] font-medium rounded-lg bg-brand-secondary/15 hover:bg-brand-secondary/30 text-brand-primary transition-colors cursor-pointer"
                >
                  + Error Snippet
                </button>
              </div>

              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={5}
                placeholder="Please describe what occurred, when it started, error codes shown, and any troubleshooting steps already attempted..."
                className="w-full px-4 py-3 text-xs sm:text-sm bg-app-background border border-brand-secondary/40 rounded-2xl text-brand-primary placeholder:text-brand-secondary/60 focus:outline-none focus:ring-2 focus:ring-brand-accent/40 focus:border-brand-primary transition-all resize-y leading-relaxed"
              />
            </div>

            {/* Custom Tags */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-brand-primary">
                Search Tags (Optional, comma-separated)
              </label>
              <input
                type="text"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="e.g. wifi, eduroam, laptop, student-portal"
                className="w-full px-4 py-2.5 text-xs sm:text-sm bg-app-background border border-brand-secondary/40 rounded-xl text-brand-primary placeholder:text-brand-secondary/60 focus:outline-none focus:ring-2 focus:ring-brand-accent/40 focus:border-brand-primary transition-all"
              />
            </div>
          </div>

          {/* Section 3: Classification & Category */}
          <div id="classification" className="bg-app-background border border-brand-primary/15 rounded-3xl p-5 sm:p-6 shadow-subtle space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-brand-primary">
                  Step 3: Classify Your Request <span className="text-brand-primary font-bold">*</span>
                </label>
                <p className="text-[11px] text-brand-secondary m-0 mt-0.5">
                  Directs the ticket to the specialized engineering queue
                </p>
              </div>
            </div>

            {/* Category Cards Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {categories.map((cat) => (
                <CategoryCard
                  key={cat.id}
                  category={cat}
                  isSelected={selectedCategoryId === cat.id}
                  onSelect={(id) => setSelectedCategoryId(id)}
                />
              ))}
            </div>

            {/* Dynamic Contextual Category Fields */}
            {selectedCategoryObj && (
              <DynamicCategoryFields
                categoryName={selectedCategoryObj.name}
                dynamicData={dynamicData}
                setDynamicData={setDynamicData}
              />
            )}
          </div>

          {/* Section 4: Impact & Urgency Matrix (ITIL Priority) */}
          <div className="bg-app-background border border-brand-primary/15 rounded-3xl p-5 sm:p-6 shadow-subtle">
            <ImpactUrgencyMatrix
              impact={impact}
              setImpact={setImpact}
              urgency={urgency}
              setUrgency={setUrgency}
              isOverride={isOverride}
              setIsOverride={setIsOverride}
              overridePriority={overridePriority}
              setOverridePriority={setOverridePriority}
              overrideReason={overrideReason}
              setOverrideReason={setOverrideReason}
              subjectText={title}
              descText={description}
            />
          </div>

          {/* Section 5: Location, Contact & System Context (Optional) */}
          <div className="bg-app-background border border-brand-primary/15 rounded-3xl p-5 sm:p-6 shadow-subtle">
            <LocationAndContactFields
              locationData={locationData}
              setLocationData={setLocationData}
              currentUserEmail={user?.email}
            />
          </div>

          {/* Section 6: Attachments & Diagnostics */}
          <div id="attachments" className="bg-app-background border border-brand-primary/15 rounded-3xl p-5 sm:p-6 shadow-subtle">
            <FileDropzone
              files={files}
              setFiles={setFiles}
              error={fileError}
              setError={setFileError}
            />
          </div>

          {/* Global Error Notice if Submission Failed */}
          {errorMessage && (
            <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-xs sm:text-sm text-red-700 flex items-start gap-2.5 shadow-sm">
              <i className="bi bi-exclamation-triangle-fill text-red-600 text-base flex-shrink-0 mt-0.5" />
              <div className="leading-relaxed font-medium">
                {errorMessage}
              </div>
            </div>
          )}
        </div>

        {/* Right: Sticky Live Summary & Real-Time Copilot Panel */}
        <div className="lg:col-span-4">
          <LiveTicketSummaryPanel
            requestType={requestType}
            title={title}
            description={description}
            selectedCategory={selectedCategoryObj}
            dynamicData={dynamicData}
            priority={activePriority}
            locationData={locationData}
            files={files}
            duplicateResults={duplicateResults}
            duplicateLoading={duplicateLoading}
            suggestedKb={suggestedKb}
            kbLoading={kbLoading}
            lastSavedAt={lastSavedAt}
            isSavingDraft={isSavingDraft}
            onSaveDraftManual={saveDraftToStorage}
            onDiscardDraft={handleClearDraft}
            onSubmitTicket={handleSubmitTicket}
            submitting={submitting}
            validationErrors={validationErrors}
          />
        </div>
      </div>
    </div>
  );
};
