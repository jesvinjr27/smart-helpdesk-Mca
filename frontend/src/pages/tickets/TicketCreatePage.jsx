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
    <div className="container px-0" style={{ maxWidth: '1080px' }}>
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
            className="btn btn-outline-secondary btn-sm rounded-3 px-3"
          >
            <i className="bi bi-x-lg me-1"></i>Cancel
          </button>
        }
      />

      <div className="row g-4">
        {/* Ticket Submission Form Column */}
        <div className="col-lg-7">
          <div className="card shadow-sm p-4">
            {errorMessage && (
              <div className="alert alert-danger py-2.5 px-3 text-sm rounded-3 mb-4 d-flex align-items-center gap-2">
                <i className="bi bi-exclamation-octagon-fill text-danger"></i>
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="mb-3.5">
                <label className="form-label">
                  Ticket Subject / Title <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  required
                  minLength={3}
                  className="form-control"
                  placeholder="e.g. Cannot connect to GlobalProtect VPN from home"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
                <span className="text-muted text-xs mt-1 d-block">
                  Be descriptive so AI can search knowledge articles accurately.
                </span>
              </div>

              <div className="row g-3 mb-3.5">
                <div className="col-sm-6">
                  <label className="form-label">
                    Category <span className="text-danger">*</span>
                  </label>
                  <select
                    required
                    className="form-select"
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-sm-6">
                  <label className="form-label">Priority Level</label>
                  <select
                    className="form-select"
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                  >
                    <option value="LOW">Low (Routine question)</option>
                    <option value="MEDIUM">Medium (Normal business task)</option>
                    <option value="HIGH">High (Major task blocker)</option>
                    <option value="CRITICAL">Critical (Total work stoppage)</option>
                  </select>
                </div>
              </div>

              <div className="mb-3.5">
                <label className="form-label">
                  Detailed Description <span className="text-danger">*</span>
                </label>
                <textarea
                  required
                  minLength={5}
                  rows={6}
                  className="form-control"
                  placeholder="Provide steps to reproduce, device name, operating system, and specific error codes..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                ></textarea>
              </div>

              <div className="mb-4">
                <label className="form-label">Tags (comma-separated)</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="vpn, macos, wifi, authentication"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                />
              </div>

              <div className="d-flex justify-content-end gap-2 pt-3 border-top border-subtle">
                <button
                  type="button"
                  onClick={() => navigate('/tickets')}
                  className="btn btn-outline-secondary px-3"
                >
                  Discard
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn btn-primary px-4 fw-semibold shadow-sm d-flex align-items-center gap-2"
                >
                  {submitting ? (
                    <>
                      <span className="spinner-border spinner-border-sm" role="status"></span>
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <i className="bi bi-send-fill"></i>
                      <span>Submit Ticket</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* AI Copilot & Pre-Submission Assistance Column */}
        <div className="col-lg-5">
          {/* Critical Emergency Alert */}
          {criticalNotice && (
            <div className="alert alert-danger border-danger p-3 mb-3 rounded-4 shadow-sm">
              <div className="d-flex gap-2.5">
                <i className="bi bi-exclamation-octagon-fill fs-4 text-danger flex-shrink-0"></i>
                <div>
                  <h6 className="fw-bold mb-1 text-danger">Critical Outage / Emergency Detected</h6>
                  <p className="text-xs text-danger mb-0" style={{ lineHeight: 1.4 }}>
                    Your ticket contains emergency keywords matching system failure. The priority has been
                    elevated to <b>CRITICAL</b> with an accelerated 1-hour resolution target.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* AI Knowledge Suggestions Card */}
          <div className="card shadow-sm border-default h-100">
            <div className="card-header py-3 d-flex align-items-center justify-content-between border-subtle">
              <div className="d-flex align-items-center gap-2">
                <div
                  className="rounded-circle d-flex align-items-center justify-content-center text-primary"
                  style={{ width: '28px', height: '28px', background: 'var(--primary-subtle)' }}
                >
                  <i className="bi bi-stars"></i>
                </div>
                <div>
                  <h6 className="fw-bold mb-0 text-primary-emphasis text-sm">Instant AI Self-Service</h6>
                  <span className="text-xs text-muted">Local FAISS Vector Engine</span>
                </div>
              </div>
              {aiSearching && (
                <span className="spinner-border spinner-border-sm text-primary" role="status"></span>
              )}
            </div>

            <div className="card-body p-3">
              <p className="text-xs text-muted mb-3">
                As you type, our zero-cloud-leakage semantic search looks for verified troubleshooting steps
                to help resolve your issue immediately without waiting for support.
              </p>

              {suggestedKb.length === 0 ? (
                <div className="text-center py-5 text-muted">
                  <div
                    className="rounded-circle d-inline-flex align-items-center justify-content-center mb-2"
                    style={{ width: '48px', height: '48px', background: 'var(--bg-surface-subtle)' }}
                  >
                    <i className="bi bi-lightbulb fs-3 text-muted"></i>
                  </div>
                  <p className="text-xs text-muted mb-0">
                    Type a subject and description to view live verified solution guides.
                  </p>
                </div>
              ) : (
                <div className="d-flex flex-column gap-2.5">
                  {suggestedKb.map((kb) => (
                    <div
                      key={kb.chunk_id}
                      className="p-3 rounded-3 border border-default card-hover-lift"
                      style={{ backgroundColor: 'var(--bg-surface-subtle)' }}
                    >
                      <div className="d-flex justify-content-between align-items-center mb-1.5">
                        <span className="badge bg-primary-subtle text-primary text-xs">
                          <i className="bi bi-check2-circle me-1"></i>
                          Match: {Math.round(kb.similarity_score * 100)}%
                        </span>
                        <span className="text-xs text-muted font-monospace">
                          #{kb.chunk_id.slice(0, 8)}
                        </span>
                      </div>
                      <h6 className="fw-semibold text-sm text-primary-emphasis mb-1">
                        {kb.article_title}
                      </h6>
                      <p
                        className="text-xs text-secondary mb-0 line-clamp-3"
                        style={{ maxHeight: '80px', overflow: 'hidden' }}
                      >
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
    </div>
  );
};
