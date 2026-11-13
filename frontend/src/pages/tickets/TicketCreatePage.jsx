import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createTicketApi, getCategoriesApi, searchKnowledgeApi } from '../../api';

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
    <div className="container" style={{ maxWidth: '960px' }}>
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h4 className="fw-bold mb-1">Create Support Ticket</h4>
          <p className="text-muted text-sm mb-0">
            Submit an incident or service request. Our AI automatically classifies and routes your ticket.
          </p>
        </div>
        <button
          onClick={() => navigate('/tickets')}
          className="btn btn-outline-secondary btn-sm"
        >
          <i className="bi bi-x-lg me-1"></i>Cancel
        </button>
      </div>

      <div className="row g-4">
        {/* Ticket Submission Form */}
        <div className="col-lg-7">
          <div className="card shadow-sm p-4">
            {errorMessage && (
              <div className="alert alert-danger py-2 small mb-3">{errorMessage}</div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label fw-semibold small">
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
              </div>

              <div className="row g-3 mb-3">
                <div className="col-sm-6">
                  <label className="form-label fw-semibold small">
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
                  <label className="form-label fw-semibold small">Priority</label>
                  <select
                    className="form-select"
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                  >
                    <option value="LOW">Low (Routine query)</option>
                    <option value="MEDIUM">Medium (Normal business impact)</option>
                    <option value="HIGH">High (Major task blocker)</option>
                    <option value="CRITICAL">Critical (Total work stoppage)</option>
                  </select>
                </div>
              </div>

              <div className="mb-3">
                <label className="form-label fw-semibold small">
                  Detailed Description <span className="text-danger">*</span>
                </label>
                <textarea
                  required
                  minLength={5}
                  rows={6}
                  className="form-control"
                  placeholder="Provide steps to reproduce, error codes, device name, and screenshots..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                ></textarea>
              </div>

              <div className="mb-4">
                <label className="form-label fw-semibold small">Tags (comma-separated)</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="vpn, macos, remote, wifi"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                />
              </div>

              <div className="d-flex justify-content-end gap-2">
                <button
                  type="button"
                  onClick={() => navigate('/tickets')}
                  className="btn btn-light"
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
                      <i className="bi bi-send"></i>
                      <span>Submit Ticket</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* AI Copilot & Pre-Submission Assistance */}
        <div className="col-lg-5">
          {/* Critical Emergency Alert */}
          {criticalNotice && (
            <div className="alert alert-danger border-danger p-3 mb-3 rounded-3 shadow-sm">
              <div className="d-flex gap-2">
                <i className="bi bi-exclamation-octagon-fill fs-4 text-danger"></i>
                <div>
                  <h6 className="fw-bold mb-1">Critical Priority Detected</h6>
                  <p className="text-xs mb-0">
                    Your description matches critical system failure keywords. This ticket is
                    automatically elevated to CRITICAL priority with accelerated 1-hour SLA.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* AI Knowledge Suggestions */}
          <div className="card shadow-sm border-primary border-opacity-25 bg-light h-100">
            <div className="card-header bg-white border-0 pt-3 pb-2 d-flex align-items-center justify-content-between">
              <div className="d-flex align-items-center gap-2">
                <i className="bi bi-stars text-primary fs-5"></i>
                <h6 className="fw-bold mb-0 text-primary">AI Instant Self-Service</h6>
              </div>
              {aiSearching && (
                <span className="spinner-border spinner-border-sm text-primary" role="status"></span>
              )}
            </div>
            <div className="card-body">
              <p className="text-xs text-muted mb-3">
                As you type, our local AI searches authorized knowledge articles to help you solve
                the problem immediately without waiting for an agent.
              </p>

              {suggestedKb.length === 0 ? (
                <div className="text-center py-4 text-muted text-xs">
                  <i className="bi bi-lightbulb fs-3 text-secondary d-block mb-1"></i>
                  Type in your title and description to see live solution guides.
                </div>
              ) : (
                <div className="d-flex flex-column gap-2">
                  {suggestedKb.map((kb) => (
                    <div key={kb.chunk_id} className="p-3 bg-white rounded-3 border shadow-sm">
                      <div className="d-flex justify-content-between align-items-center mb-1">
                        <span className="badge bg-primary-subtle text-primary text-xs">
                          Match: {Math.round(kb.similarity_score * 100)}%
                        </span>
                        <span className="text-xs text-muted">ID: {kb.chunk_id.slice(0, 8)}</span>
                      </div>
                      <h6 className="fw-semibold text-sm mb-1">{kb.article_title}</h6>
                      <p className="text-xs text-secondary mb-2 line-clamp-3" style={{ maxHeight: '80px', overflow: 'hidden' }}>
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
