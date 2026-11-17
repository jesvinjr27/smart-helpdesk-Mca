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
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60">
            <i className="bi bi-shield-lock-fill text-xs" />
            <span>100% On-Device</span>
          </span>
        }
        actions={
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Tone:</span>
            <select
              className="px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors cursor-pointer"
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
            className="px-3.5 py-1.5 rounded-full text-xs font-medium border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-blue-300 dark:hover:border-blue-600 hover:text-blue-600 dark:hover:text-blue-400 shadow-xs transition-colors inline-flex items-center gap-1.5"
          >
            <i className="bi bi-arrow-up-right text-blue-600 dark:text-blue-400 text-xs" />
            <span>{p}</span>
          </button>
        ))}
      </div>

      {/* Chat Conversation Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm flex flex-col min-h-[580px] overflow-hidden">
        <div className="flex-1 p-4 sm:p-6 overflow-y-auto max-h-[620px] space-y-4">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex items-start gap-3 ${
                m.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {m.role === 'assistant' && (
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center text-white text-base shadow-sm flex-shrink-0 mt-0.5">
                  <i className="bi bi-stars" />
                </div>
              )}

              <div
                className={`p-4 rounded-2xl shadow-xs text-sm leading-relaxed max-w-[85%] ${
                  m.role === 'user'
                    ? 'bg-blue-600 text-white rounded-tr-none'
                    : 'bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-tl-none'
                }`}
              >
                <div className="whitespace-pre-wrap">{m.text}</div>

                {/* Citations & Metadata for Assistant Messages */}
                {m.role === 'assistant' && m.citations?.length > 0 && (
                  <div className="mt-3.5 pt-3 border-t border-slate-200 dark:border-slate-700/80">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider inline-flex items-center gap-1">
                        <i className="bi bi-link-45deg text-xs" />
                        <span>Verified Sources ({m.citations.length})</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopy(m.text, idx)}
                        className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 font-medium inline-flex items-center gap-1"
                      >
                        {copiedIndex === idx ? (
                          <>
                            <i className="bi bi-check2 text-emerald-500" />
                            <span className="text-emerald-500 font-semibold">Copied</span>
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
                          className="px-2.5 py-1 rounded-lg text-xs font-medium bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 inline-flex items-center gap-1 shadow-xs"
                        >
                          <i className="bi bi-file-earmark-check text-blue-600 dark:text-blue-400 text-xs" />
                          <span>
                            {c.article_title} ({Math.round(c.similarity_score * 100)}%)
                          </span>
                        </span>
                      ))}
                    </div>

                    <div className="text-[11px] text-slate-400 mt-2.5 flex items-center gap-3">
                      <span>
                        Model: <b className="text-slate-700 dark:text-slate-300">{m.model}</b>
                      </span>
                      {m.execTime && <span>• {m.execTime} ms</span>}
                      {m.grounded && (
                        <span className="text-emerald-600 dark:text-emerald-400 font-semibold inline-flex items-center gap-1">
                          <i className="bi bi-patch-check-fill" />
                          <span>Grounded</span>
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {m.role === 'user' && (
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-sm shadow-sm flex-shrink-0 mt-0.5">
                  <i className="bi bi-person-fill" />
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center text-white text-base shadow-sm flex-shrink-0">
                <i className="bi bi-stars" />
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                <span className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin flex-shrink-0" />
                <span>Retrieving verified knowledge chunks & synthesizing grounded response...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar Footer */}
        <div className="p-3 sm:p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-850/40">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
          >
            <div className="flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-full shadow-sm p-1.5 focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all">
              <input
                type="text"
                className="flex-1 bg-transparent border-0 px-4 text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none"
                placeholder="Ask technical question, error code, or policy query..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <button
                type="submit"
                disabled={loading || !query.trim()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-xs rounded-full shadow-xs transition-colors inline-flex items-center gap-1.5 flex-shrink-0 disabled:opacity-50"
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
