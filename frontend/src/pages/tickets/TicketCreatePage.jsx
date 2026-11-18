import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createTicketApi, getCategoriesApi, searchKnowledgeApi } from '../../api';
import { PageHeader } from '../../components/common/PageHeader';

export const TicketCreatePage = () => {
  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [priority, setPriority] = useState('MEDIUM');
  const [tagsInput, setTagsInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // AI suggestions state
  const [suggestedKb, setSuggestedKb] = useState([]);
  const [aiSearching, setAiSearching] = useState(false);
  const [criticalNotice, setCriticalNotice] = useState(false);

  useEffect(() => {
    const fetchCats = async () => {
      try {
        const resp = await getCategoriesApi();
        setCategories(resp.data);
        if (resp.data.length > 0) {
          setCategoryId(resp.data[0].id);
        }
      } catch (err) {
        console.error('Failed to load categories:', err);
      }
    };
    fetchCats();
  }, []);

  // Debounced search for relevant KB articles
  useEffect(() => {
    if (!title && !description) {
      setSuggestedKb([]);
      setCriticalNotice(false);
      return;
    }

    const lower = `${title} ${description}`.toLowerCase();
    const isEmergency = ['server down', 'outage', 'data loss', 'security breach', 'fire', 'leakage'].some(
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
          setSuggestedKb(resp.data.results || []);
        } catch (e) {
          // Ignore
        } finally {
          setAiSearching(false);
        }
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [title, description]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSubmitting(true);

    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    try {
      const resp = await createTicketApi({
        title,
        description,
        category_id: categoryId,
        priority,
        tags,
      });
      navigate(`/tickets/${resp.data.id}`);
    } catch (err) {
      setErrorMessage(err.response?.data?.detail || 'Failed to submit ticket.');
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-full min-w-0 space-y-6">
      <PageHeader
        title="Create New Support Ticket"
        subtitle="Submit an incident or service request. Our local AI classifies and routes your ticket with zero cloud leakage."
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

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Ticket Submission Form Column */}
        <div className="lg:col-span-7">
          <div className="card-glow p-5 sm:p-7 rounded-2xl">
            {errorMessage && (
              <div className="p-3.5 rounded-xl bg-brand-primary/10 border border-brand-primary/30 flex items-start gap-2.5 text-xs text-brand-primary mb-5">
                <i className="bi bi-exclamation-octagon-fill text-brand-primary text-base flex-shrink-0" />
                <span className="leading-relaxed">{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-brand-primary mb-1.5">
                  Ticket Subject / Title <span className="text-brand-primary font-bold">*</span>
                </label>
                <input
                  type="text"
                  required
                  minLength={3}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Cannot connect to GlobalProtect VPN from home"
                  className="w-full px-3.5 py-2.5 text-sm bg-app-background border border-brand-secondary/40 rounded-xl text-brand-primary placeholder:text-brand-secondary/60 focus:outline-none focus:ring-2 focus:ring-brand-accent/40 focus:border-brand-primary transition-colors"
                />
                <span className="text-brand-secondary text-xs mt-1 block">
                  Be descriptive so AI can search knowledge articles accurately.
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-brand-primary mb-1.5">
                    Category <span className="text-brand-primary font-bold">*</span>
                  </label>
                  <select
                    required
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm bg-app-background border border-brand-secondary/40 rounded-xl text-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-accent/40 focus:border-brand-primary transition-colors cursor-pointer"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-brand-primary mb-1.5">
                    Priority Level
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm bg-app-background border border-brand-secondary/40 rounded-xl text-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-accent/40 focus:border-brand-primary transition-colors cursor-pointer"
                  >
                    <option value="LOW">Low (Routine question)</option>
                    <option value="MEDIUM">Medium (Normal business task)</option>
                    <option value="HIGH">High (Major task blocker)</option>
                    <option value="CRITICAL">Critical (Total work stoppage)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-brand-primary mb-1.5">
                  Detailed Description <span className="text-brand-primary font-bold">*</span>
                </label>
                <textarea
                  required
                  minLength={5}
                  rows={6}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Provide steps to reproduce, device name, operating system, and specific error codes..."
                  className="w-full px-3.5 py-2.5 text-sm bg-app-background border border-brand-secondary/40 rounded-xl text-brand-primary placeholder:text-brand-secondary/60 focus:outline-none focus:ring-2 focus:ring-brand-accent/40 focus:border-brand-primary transition-colors resize-y"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-brand-primary mb-1.5">
                  Tags (comma-separated)
                </label>
                <input
                  type="text"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  placeholder="vpn, macos, wifi, authentication"
                  className="w-full px-3.5 py-2.5 text-sm bg-app-background border border-brand-secondary/40 rounded-xl text-brand-primary placeholder:text-brand-secondary/60 focus:outline-none focus:ring-2 focus:ring-brand-accent/40 focus:border-brand-primary transition-colors"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-brand-primary/10">
                <button
                  type="button"
                  onClick={() => navigate('/tickets')}
                  className="px-4 py-2 text-sm font-medium rounded-xl border border-brand-primary/20 bg-app-background text-brand-primary hover:bg-brand-secondary/15 transition-colors"
                >
                  Discard
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 text-sm font-semibold rounded-xl bg-brand-primary hover:bg-brand-primary/90 text-white shadow-subtle transition-all inline-flex items-center gap-2 disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <i className="bi bi-send-fill" />
                      <span>Submit Ticket</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* AI Copilot & Pre-Submission Assistance Column */}
        <div className="lg:col-span-5 space-y-4">
          {/* Critical Emergency Alert */}
          {criticalNotice && (
            <div className="p-4 rounded-2xl bg-brand-primary/10 border border-brand-primary/30 shadow-subtle animate-scaleUp">
              <div className="flex items-start gap-3">
                <i className="bi bi-exclamation-octagon-fill text-xl text-brand-primary flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-sm text-brand-primary mb-1">
                    Critical Outage / Emergency Detected
                  </h4>
                  <p className="text-xs text-brand-secondary leading-relaxed">
                    Your ticket contains emergency keywords matching system failure. The priority has been
                    elevated to <b>CRITICAL</b> with an accelerated 1-hour resolution target.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* AI Knowledge Suggestions Card */}
          <div className="card-glow p-5 sm:p-6 rounded-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-brand-primary/15 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-brand-secondary/20 text-brand-primary flex items-center justify-center flex-shrink-0">
                  <i className="bi bi-stars" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-brand-primary">
                    Instant AI Self-Service
                  </h3>
                  <span className="text-[11px] text-brand-secondary">Local FAISS Vector Engine</span>
                </div>
              </div>
              {aiSearching && (
                <span className="w-4 h-4 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
              )}
            </div>

            <p className="text-xs text-brand-secondary mb-4 leading-relaxed">
              As you type, our zero-cloud-leakage semantic search looks for verified troubleshooting steps
              to help resolve your issue immediately without waiting for support.
            </p>

            {suggestedKb.length === 0 ? (
              <div className="text-center py-8 text-brand-secondary">
                <div className="w-12 h-12 mx-auto rounded-full bg-brand-secondary/15 flex items-center justify-center mb-2 text-xl text-brand-primary">
                  <i className="bi bi-lightbulb" />
                </div>
                <p className="text-xs max-w-xs mx-auto">
                  Type a subject and description to view live verified solution guides.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {suggestedKb.map((kb) => (
                  <div
                    key={kb.chunk_id}
                    className="p-3.5 rounded-xl card-glow-interactive"
                  >
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-brand-secondary/20 text-brand-primary border border-brand-secondary/40">
                        <i className="bi bi-check2-circle text-xs" />
                        <span>Match: {Math.round(kb.similarity_score * 100)}%</span>
                      </span>
                      <span className="text-[10px] text-brand-secondary font-mono">
                        #{kb.chunk_id.slice(0, 8)}
                      </span>
                    </div>
                    <h4 className="font-semibold text-xs text-brand-primary mb-1">
                      {kb.article_title}
                    </h4>
                    <p className="text-xs text-brand-secondary line-clamp-3 leading-relaxed">
                      {kb.content}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
