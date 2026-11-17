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
    <div className="w-full max-w-full min-w-0 space-y-5">
      <PageHeader
        title="Local AI Copilot & Knowledge Assistant"
        subtitle="Zero cloud data leakage: grounded RAG answers synthesized strictly from approved organizational documentation."
        badge={
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-brand-secondary/20 text-brand-primary border border-brand-secondary/40">
            <i className="bi bi-shield-lock-fill text-xs text-brand-primary" />
            <span>100% On-Device</span>
          </span>
        }
        actions={
          <div className="flex items-center gap-2">
            <span className="text-xs text-brand-secondary font-semibold">Tone:</span>
            <select
              className="px-3 py-1.5 text-xs bg-app-background border border-brand-secondary/40 rounded-xl text-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-accent/40 focus:border-brand-primary transition-colors cursor-pointer"
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
      <div className="flex flex-wrap gap-2">
        {samplePrompts.map((p, i) => (
          <button
            key={i}
            type="button"
            onClick={() => handleSend(p)}
            className="px-3.5 py-1.5 rounded-full text-xs font-medium border border-brand-secondary/30 bg-app-background text-brand-primary hover:border-brand-primary hover:bg-brand-secondary/15 shadow-subtle transition-all inline-flex items-center gap-1.5"
          >
            <i className="bi bi-arrow-up-right text-brand-secondary text-xs" />
            <span>{p}</span>
          </button>
        ))}
      </div>

      {/* Chat Conversation Card */}
      <div className="bg-app-background border border-brand-primary/15 rounded-2xl shadow-subtle flex flex-col min-h-[580px] overflow-hidden">
        <div className="flex-1 p-4 sm:p-6 overflow-y-auto max-h-[620px] space-y-4">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex items-start gap-3 ${
                m.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {m.role === 'assistant' && (
                <div className="w-9 h-9 rounded-xl bg-brand-primary flex items-center justify-center text-brand-accent text-base shadow-subtle flex-shrink-0 mt-0.5">
                  <i className="bi bi-stars" />
                </div>
              )}

              <div
                className={`p-4 rounded-2xl shadow-subtle text-sm leading-relaxed max-w-[85%] ${
                  m.role === 'user'
                    ? 'bg-brand-primary text-white rounded-tr-none'
                    : 'bg-brand-secondary/10 border border-brand-secondary/30 text-brand-primary rounded-tl-none'
                }`}
              >
                <div className="whitespace-pre-wrap">{m.text}</div>

                {/* Citations & Metadata for Assistant Messages */}
                {m.role === 'assistant' && m.citations?.length > 0 && (
                  <div className="mt-3.5 pt-3 border-t border-brand-secondary/30">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-[11px] font-bold text-brand-secondary uppercase tracking-wider inline-flex items-center gap-1">
                        <i className="bi bi-link-45deg text-xs" />
                        <span>Verified Sources ({m.citations.length})</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopy(m.text, idx)}
                        className="text-xs text-brand-primary hover:text-brand-secondary font-medium inline-flex items-center gap-1 transition-colors"
                      >
                        {copiedIndex === idx ? (
                          <>
                            <i className="bi bi-check2 text-brand-primary" />
                            <span className="text-brand-primary font-semibold">Copied</span>
                          </>
                        ) : (
                          <>
                            <i className="bi bi-clipboard" />
                            <span>Copy Answer</span>
                          </>
                        )}
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {m.citations.map((c, ci) => (
                        <span
                          key={ci}
                          className="px-2.5 py-1 rounded-lg text-xs font-medium bg-app-background text-brand-primary border border-brand-secondary/30 inline-flex items-center gap-1 shadow-subtle"
                        >
                          <i className="bi bi-file-earmark-check text-brand-secondary text-xs" />
                          <span>
                            {c.article_title} ({Math.round(c.similarity_score * 100)}%)
                          </span>
                        </span>
                      ))}
                    </div>

                    <div className="text-[11px] text-brand-secondary mt-2.5 flex items-center gap-3">
                      <span>
                        Model: <b className="text-brand-primary">{m.model}</b>
                      </span>
                      {m.execTime && <span>• {m.execTime} ms</span>}
                      {m.grounded && (
                        <span className="text-brand-primary font-semibold inline-flex items-center gap-1">
                          <i className="bi bi-patch-check-fill text-brand-primary" />
                          <span>Grounded</span>
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {m.role === 'user' && (
                <div className="w-9 h-9 rounded-xl bg-brand-secondary flex items-center justify-center text-white text-sm shadow-subtle flex-shrink-0 mt-0.5">
                  <i className="bi bi-person-fill" />
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-brand-primary flex items-center justify-center text-brand-accent text-base shadow-subtle flex-shrink-0">
                <i className="bi bi-stars" />
              </div>
              <div className="p-3.5 rounded-2xl bg-brand-secondary/10 border border-brand-secondary/30 flex items-center gap-3 text-xs text-brand-primary">
                <span className="w-4 h-4 border-2 border-brand-primary border-t-transparent rounded-full animate-spin flex-shrink-0" />
                <span>Retrieving verified knowledge chunks & synthesizing grounded response...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar Footer */}
        <div className="p-3 sm:p-4 border-t border-brand-primary/15 bg-brand-secondary/5">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
          >
            <div className="flex items-center bg-app-background border border-brand-secondary/40 rounded-full shadow-subtle p-1.5 focus-within:ring-2 focus-within:ring-brand-accent/40 focus-within:border-brand-primary transition-all">
              <input
                type="text"
                className="flex-1 bg-transparent border-0 px-4 text-xs sm:text-sm text-brand-primary placeholder-brand-secondary/60 focus:outline-none"
                placeholder="Ask technical question, error code, or policy query..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <button
                type="submit"
                disabled={loading || !query.trim()}
                className="px-4 py-2 bg-brand-primary hover:bg-brand-primary/90 active:bg-brand-primary text-white font-semibold text-xs rounded-full shadow-subtle transition-colors inline-flex items-center gap-1.5 flex-shrink-0 disabled:opacity-50"
              >
                <span className="hidden sm:inline">Ask Copilot</span>
                <i className="bi bi-arrow-up-short text-base" />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
