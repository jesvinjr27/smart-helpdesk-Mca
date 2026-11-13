import React, { useState } from 'react';
import { generateAIAssistApi } from '../../api';

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

  const samplePrompts = [
    'How do I fix GlobalProtect VPN error 403?',
    'What are the steps to reset a forgotten password?',
    'How do I connect my device to campus Eduroam Wi-Fi?',
    'Canvas LMS is not displaying my registered course.',
  ];

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
          text: 'Unable to reach the local AI service. Please ensure the local backend and knowledge vector store are synchronized.',
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
    <div className="container" style={{ maxWidth: '960px' }}>
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-2">
        <div>
          <div className="d-flex align-items-center gap-2">
            <h4 className="fw-bold mb-1">Local AI Copilot</h4>
            <span className="badge bg-primary-subtle text-primary border border-primary-subtle">
              <i className="bi bi-shield-lock me-1"></i>Zero Cloud Leakage
            </span>
          </div>
          <p className="text-muted text-sm mb-0">
            Grounded local RAG response generator running strictly on your local infrastructure.
          </p>
        </div>

        {/* Tone Selector */}
        <div className="d-flex align-items-center gap-2">
          <span className="text-xs text-muted fw-semibold">Tone:</span>
          <select
            className="form-select form-select-sm"
            style={{ width: '140px' }}
            value={tone}
            onChange={(e) => setTone(e.target.value)}
          >
            <option value="professional">Professional</option>
            <option value="concise">Concise Bullet</option>
            <option value="step-by-step">Step-by-Step</option>
          </select>
        </div>
      </div>

      {/* Preset Prompt Pills */}
      <div className="d-flex flex-wrap gap-2 mb-3">
        {samplePrompts.map((p, i) => (
          <button
            key={i}
            onClick={() => handleSend(p)}
            className="btn btn-sm btn-outline-secondary rounded-pill py-1 px-3 text-xs"
          >
            <i className="bi bi-arrow-up-right me-1"></i>
            {p}
          </button>
        ))}
      </div>

      {/* Chat Conversation Card */}
      <div className="card shadow-sm border-0 mb-3" style={{ minHeight: '520px' }}>
        <div
          className="card-body p-4 overflow-y-auto d-flex flex-column gap-3"
          style={{ maxHeight: '600px' }}
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
                  className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center flex-shrink-0"
                  style={{ width: '38px', height: '38px' }}
                >
                  <i className="bi bi-robot fs-5"></i>
                </div>
              )}

              <div
                className={`p-3 rounded-4 shadow-sm ${
                  m.role === 'user'
                    ? 'bg-primary text-white text-end'
                    : 'bg-white border text-dark'
                }`}
                style={{ maxWidth: '82%' }}
              >
                <div className="text-sm" style={{ whiteSpace: 'pre-wrap' }}>
                  {m.text}
                </div>

                {/* Citations & Metadata (For Assistant responses) */}
                {m.role === 'assistant' && m.citations?.length > 0 && (
                  <div className="mt-3 pt-2 border-top">
                    <div className="d-flex align-items-center justify-content-between mb-2">
                      <span className="text-xs fw-bold text-muted text-uppercase">
                        <i className="bi bi-link-45deg me-1"></i>Verified Sources (
                        {m.citations.length})
                      </span>
                      <button
                        onClick={() => handleCopy(m.text, idx)}
                        className="btn btn-sm btn-link text-decoration-none text-xs p-0 text-primary"
                      >
                        {copiedIndex === idx ? (
                          <>
                            <i className="bi bi-check me-1"></i>Copied
                          </>
                        ) : (
                          <>
                            <i className="bi bi-clipboard me-1"></i>Copy Draft
                          </>
                        )}
                      </button>
                    </div>

                    <div className="d-flex flex-wrap gap-1">
                      {m.citations.map((c, ci) => (
                        <span
                          key={ci}
                          className="badge bg-light text-dark border text-xs"
                          title={`Score: ${c.similarity_score}`}
                        >
                          <i className="bi bi-file-earmark-text text-primary me-1"></i>
                          {c.article_title} ({Math.round(c.similarity_score * 100)}%)
                        </span>
                      ))}
                    </div>

                    <div className="text-xs text-muted mt-2 d-flex align-items-center gap-2">
                      <span>Model: <b>{m.model}</b></span>
                      {m.execTime && <span>• {m.execTime} ms</span>}
                    </div>
                  </div>
                )}
              </div>

              {m.role === 'user' && (
                <div
                  className="rounded-circle bg-secondary text-white d-flex align-items-center justify-content-center flex-shrink-0"
                  style={{ width: '38px', height: '38px' }}
                >
                  <i className="bi bi-person fs-5"></i>
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="d-flex gap-3 align-items-center">
              <div
                className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center flex-shrink-0"
                style={{ width: '38px', height: '38px' }}
              >
                <i className="bi bi-robot fs-5"></i>
              </div>
              <div className="card p-3 bg-light border-0 rounded-4">
                <div className="d-flex align-items-center gap-2 text-muted text-sm">
                  <span className="spinner-border spinner-border-sm text-primary" role="status"></span>
                  <span>Retrieving verified knowledge chunks & generating grounded answer...</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input Box */}
        <div className="card-footer bg-white border-0 p-3">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
          >
            <div className="input-group input-group-lg rounded-pill overflow-hidden border">
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
                className="btn btn-primary px-4 d-flex align-items-center gap-2"
              >
                <span>Ask</span>
                <i className="bi bi-arrow-up"></i>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
