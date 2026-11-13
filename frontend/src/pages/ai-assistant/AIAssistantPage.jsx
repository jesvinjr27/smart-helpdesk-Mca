import React, { useState, useRef, useEffect } from 'react';
import { generateAIAssistApi } from '../../api';
import { PageHeader } from '../../components/common/PageHeader';

export const AIAssistantPage = () => {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: 'Hello! I am your local AI Helpdesk Copilot. I synthesize verified troubleshooting steps directly from approved organization knowledge base articles. How can I assist you today?',
      citations: [],
      model: 'local_rag_grounded',
    },
  ]);
  const [query, setQuery] = useState('');
  const [tone, setTone] = useState('professional');
  const [loading, setLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState(null);

  const messagesEndRef = useRef(null);

  const samplePrompts = [
    'How do I fix GlobalProtect VPN error 403?',
    'What are the steps to reset a forgotten password?',
    'How do I connect my device to campus Eduroam Wi-Fi?',
    'Canvas LMS is not displaying my registered course.',
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async (textToSend) => {
    const q = textToSend || query;
    if (!q.trim() || loading) return;

    const userMsg = { role: 'user', text: q };
    setMessages((prev) => [...prev, userMsg]);
    setQuery('');
    setLoading(true);

    try {
      const resp = await generateAIAssistApi({
        query: q,
        tone: tone,
      });

      const aiMsg = {
        role: 'assistant',
        text: resp.data.suggested_response,
        citations: resp.data.citations || [],
        model: resp.data.model_used,
        grounded: resp.data.grounded,
        execTime: resp.data.execution_time_ms,
        note: resp.data.note,
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: 'Unable to reach the local AI service. Please ensure the backend and FAISS vector index are running.',
          citations: [],
          model: 'error',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="container px-0" style={{ maxWidth: '1000px' }}>
      <PageHeader
        title="Local AI Copilot & Knowledge Assistant"
        subtitle="Zero cloud data leakage: grounded RAG answers synthesized strictly from approved organizational documentation."
        badge={
          <span className="badge bg-primary-subtle text-primary border border-primary-border">
            <i className="bi bi-shield-lock-fill me-1"></i>100% On-Device
          </span>
        }
        actions={
          <div className="d-flex align-items-center gap-2">
            <span className="text-xs text-muted fw-semibold">Tone:</span>
            <select
              className="form-select form-select-sm"
              style={{ width: '150px' }}
              value={tone}
              onChange={(e) => setTone(e.target.value)}
            >
              <option value="professional">Professional</option>
              <option value="concise">Concise Bullet</option>
              <option value="step-by-step">Step-by-Step</option>
            </select>
          </div>
        }
      />

      {/* Preset Prompt Pills */}
      <div className="d-flex flex-wrap gap-2 mb-3.5">
        {samplePrompts.map((p, i) => (
          <button
            key={i}
            onClick={() => handleSend(p)}
            className="btn btn-sm btn-outline-secondary rounded-pill py-1.5 px-3 text-xs d-flex align-items-center gap-1.5"
          >
            <i className="bi bi-arrow-up-right text-primary"></i>
            <span>{p}</span>
          </button>
        ))}
      </div>

      {/* Chat Conversation Card */}
      <div className="card shadow-sm border-default mb-4" style={{ minHeight: '560px' }}>
        <div
          className="card-body p-4 overflow-y-auto d-flex flex-column gap-3.5"
          style={{ maxHeight: '620px' }}
        >
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`d-flex gap-3 ${
                m.role === 'user' ? 'justify-content-end' : 'justify-content-start'
              }`}
            >
              {m.role === 'assistant' && (
                <div
                  className="rounded-circle d-flex align-items-center justify-content-center text-white flex-shrink-0 shadow-sm"
                  style={{
                    width: '38px',
                    height: '38px',
                    background: 'var(--ai-gradient)',
                    fontSize: '1rem',
                  }}
                >
                  <i className="bi bi-stars"></i>
                </div>
              )}

              <div
                className={`p-3.5 rounded-4 shadow-sm ${
                  m.role === 'user'
                    ? 'bg-primary text-white text-start'
                    : 'border border-default'
                }`}
                style={{
                  maxWidth: '82%',
                  backgroundColor: m.role === 'user' ? 'var(--primary)' : 'var(--bg-surface)',
                  color: m.role === 'user' ? '#ffffff' : 'var(--text-primary)',
                }}
              >
                <div
                  className="text-sm"
                  style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}
                >
                  {m.text}
                </div>

                {/* Citations & Metadata for Assistant Messages */}
                {m.role === 'assistant' && m.citations?.length > 0 && (
                  <div className="mt-3 pt-2.5 border-top border-subtle">
                    <div className="d-flex align-items-center justify-content-between mb-2">
                      <span className="text-xs fw-bold text-muted text-uppercase tracking-wider">
                        <i className="bi bi-link-45deg me-1"></i>Verified Sources ({m.citations.length})
                      </span>
                      <button
                        onClick={() => handleCopy(m.text, idx)}
                        className="btn btn-sm btn-link text-decoration-none text-xs p-0 text-primary d-flex align-items-center gap-1"
                      >
                        {copiedIndex === idx ? (
                          <>
                            <i className="bi bi-check2 text-success"></i>
                            <span className="text-success fw-semibold">Copied</span>
                          </>
                        ) : (
                          <>
                            <i className="bi bi-clipboard"></i>
                            <span>Copy Answer</span>
                          </>
                        )}
                      </button>
                    </div>

                    <div className="d-flex flex-wrap gap-1.5">
                      {m.citations.map((c, ci) => (
                        <span
                          key={ci}
                          className="badge bg-surface-subtle text-primary-emphasis border border-default text-xs py-1 px-2"
                        >
                          <i className="bi bi-file-earmark-check text-primary me-1"></i>
                          {c.article_title} ({Math.round(c.similarity_score * 100)}%)
                        </span>
                      ))}
                    </div>

                    <div className="text-xs text-muted mt-2 d-flex align-items-center gap-3">
                      <span>
                        Model: <b className="text-primary-emphasis">{m.model}</b>
                      </span>
                      {m.execTime && <span>• {m.execTime} ms</span>}
                      {m.grounded && (
                        <span className="text-success">
                          <i className="bi bi-patch-check-fill me-1"></i>Grounded
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {m.role === 'user' && (
                <div
                  className="rounded-circle d-flex align-items-center justify-content-center text-white flex-shrink-0 shadow-sm"
                  style={{
                    width: '38px',
                    height: '38px',
                    background: 'var(--primary-gradient)',
                    fontSize: '0.9rem',
                  }}
                >
                  <i className="bi bi-person-fill"></i>
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="d-flex gap-3 align-items-center">
              <div
                className="rounded-circle d-flex align-items-center justify-content-center text-white flex-shrink-0 shadow-sm"
                style={{
                  width: '38px',
                  height: '38px',
                  background: 'var(--ai-gradient)',
                  fontSize: '1rem',
                }}
              >
                <i className="bi bi-stars"></i>
              </div>
              <div
                className="card p-3 border border-default rounded-4"
                style={{ backgroundColor: 'var(--bg-surface-subtle)' }}
              >
                <div className="d-flex align-items-center gap-2.5 text-muted text-sm">
                  <span className="spinner-border spinner-border-sm text-primary" role="status"></span>
                  <span>Retrieving verified knowledge chunks & synthesizing grounded response...</span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar Footer */}
        <div className="card-footer bg-surface-subtle p-3 border-top border-subtle">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
          >
            <div className="input-group input-group-lg rounded-pill overflow-hidden border border-default bg-surface shadow-sm">
              <input
                type="text"
                className="form-control border-0 ps-4 text-sm"
                placeholder="Ask technical question, error code, or policy query..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <button
                type="submit"
                disabled={loading || !query.trim()}
                className="btn btn-primary px-4 d-flex align-items-center gap-2 rounded-pill m-1"
              >
                <span>Ask Copilot</span>
                <i className="bi bi-arrow-up-short fs-5"></i>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
