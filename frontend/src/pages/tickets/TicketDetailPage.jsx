import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import {
  getTicketDetailApi,
  getTicketCommentsApi,
  addTicketCommentApi,
  getTicketHistoryApi,
  transitionTicketApi,
  assignTicketApi,
  submitAIFeedbackApi,
  generateAIAssistApi,
  getSimilarTicketsApi,
  summarizeTicketApi,
  getUsersApi,
  getTeamsApi,
} from '../../api';
import { StatusBadge } from '../../components/common/StatusBadge';
import { PriorityBadge } from '../../components/common/PriorityBadge';
import { PageHeader } from '../../components/common/PageHeader';
import { ModernModal } from '../../components/common/ModernModal';
import { CardSkeleton } from '../../components/common/LoadingSkeleton';

export const TicketDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, hasRole } = useAuth();

  const [ticket, setTicket] = useState(null);
  const [comments, setComments] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  // Comment state
  const [commentContent, setCommentContent] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);

  // Transition & Assignment Modals state
  const [showTransitionModal, setShowTransitionModal] = useState(false);
  const [targetStatus, setTargetStatus] = useState('');
  const [transitionComment, setTransitionComment] = useState('');

  const [showAssignModal, setShowAssignModal] = useState(false);
  const [availableAgents, setAvailableAgents] = useState([]);
  const [availableTeams, setAvailableTeams] = useState([]);
  const [selectedAgentId, setSelectedAgentId] = useState('');
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [assignReason, setAssignReason] = useState('');

  // AI Feedback & Assistance state
  const [aiDraftLoading, setAiDraftLoading] = useState(false);
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [similarTickets, setSimilarTickets] = useState([]);
  const [loadingSimilar, setLoadingSimilar] = useState(false);
  const [summaryText, setSummaryText] = useState('');
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [showSummaryModal, setShowSummaryModal] = useState(false);

  const canManageWorkflow = hasRole(['AGENT', 'LEAD', 'ORG_ADMIN', 'SYS_ADMIN']);

  const loadTicketData = async () => {
    try {
      const [tResp, cResp, hResp] = await Promise.all([
        getTicketDetailApi(id),
        getTicketCommentsApi(id),
        getTicketHistoryApi(id),
      ]);
      setTicket(tResp.data);
      setComments(cResp.data);
      setHistory(hResp.data);
      if (canManageWorkflow) {
        loadSimilarTickets();
      }
    } catch (err) {
      console.error('Failed to load ticket details:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadSimilarTickets = async () => {
    setLoadingSimilar(true);
    try {
      const resp = await getSimilarTicketsApi(id, 3);
      setSimilarTickets(resp.data?.similar_tickets || []);
    } catch (err) {
      console.error('Failed to fetch similar tickets:', err);
    } finally {
      setLoadingSimilar(false);
    }
  };

  const handleSummarizeTicket = async () => {
    setSummaryLoading(true);
    setShowSummaryModal(true);
    try {
      const resp = await summarizeTicketApi(id);
      setSummaryText(resp.data?.summary || 'No summary could be generated.');
    } catch (err) {
      setSummaryText('Failed to generate summary.');
    } finally {
      setSummaryLoading(false);
    }
  };

  useEffect(() => {
    loadTicketData();
  }, [id]);

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!commentContent.trim()) return;

    setSubmittingComment(true);
    try {
      await addTicketCommentApi(id, {
        content: commentContent,
        is_internal: isInternal,
      });
      setCommentContent('');
      setIsInternal(false);
      await loadTicketData();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to submit comment');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleTransitionSubmit = async () => {
    try {
      await transitionTicketApi(id, {
        status: targetStatus,
        comment: transitionComment || undefined,
        is_internal: false,
      });
      setShowTransitionModal(false);
      setTransitionComment('');
      await loadTicketData();
    } catch (err) {
      alert(err.response?.data?.detail || 'Transition failed');
    }
  };

  const openAssignModal = async () => {
    try {
      const [uResp, tResp] = await Promise.all([
        getUsersApi({ role: 'AGENT' }),
        getTeamsApi(),
      ]);
      setAvailableAgents(uResp.data);
      setAvailableTeams(tResp.data);
      setSelectedAgentId(ticket.assigned_to_id || '');
      setSelectedTeamId(ticket.assigned_team_id || '');
      setShowAssignModal(true);
    } catch (err) {
      alert('Failed to load agents list');
    }
  };

  const handleAssignSubmit = async () => {
    try {
      await assignTicketApi(id, {
        assigned_to_id: selectedAgentId || undefined,
        assigned_team_id: selectedTeamId || undefined,
        reason: assignReason || undefined,
      });
      setShowAssignModal(false);
      setAssignReason('');
      await loadTicketData();
    } catch (err) {
      alert(err.response?.data?.detail || 'Assignment failed');
    }
  };

  const handleFeedback = async (isAccurate) => {
    if (!ticket?.latest_ai_prediction) return;
    try {
      await submitAIFeedbackApi(ticket.latest_ai_prediction.id, {
        is_accurate: isAccurate,
        actual_category_id: ticket.category_id,
        actual_priority: ticket.priority,
      });
      setFeedbackSent(true);
    } catch (err) {
      console.error('Feedback failed:', err);
    }
  };

  const handleAIAssistInsert = async () => {
    setAiDraftLoading(true);
    try {
      const resp = await generateAIAssistApi({
        ticket_id: id,
        query: `Draft a professional support response to address this incident: ${ticket.title}. Details: ${ticket.description}`,
        tone: 'professional',
      });
      if (resp.data.suggested_response) {
        setCommentContent(resp.data.suggested_response);
      }
    } catch (err) {
      alert('Local AI Copilot is currently offline or indexing.');
    } finally {
      setAiDraftLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Loading Incident..." subtitle="Fetching telemetry & history..." />
        <CardSkeleton height="200px" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8"><CardSkeleton height="300px" /></div>
          <div className="lg:col-span-4"><CardSkeleton height="300px" /></div>
        </div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-bold text-brand-primary">Ticket not found</h3>
        <button
          onClick={() => navigate('/tickets')}
          className="mt-3 px-4 py-2 bg-brand-primary text-white rounded-xl text-sm hover:bg-brand-primary/90 transition-all"
        >
          Return to Tickets
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Ticket ${ticket.ticket_number}`}
        subtitle={`Created on ${new Date(ticket.created_at).toLocaleString()}`}
        breadcrumbs={[
          { label: 'Dashboard', link: '/dashboard' },
          { label: 'Tickets', link: '/tickets' },
          { label: ticket.ticket_number },
        ]}
        actions={
          <button
            onClick={() => navigate('/tickets')}
            className="px-3.5 py-1.5 rounded-xl border border-brand-primary/20 bg-app-background text-brand-primary hover:bg-brand-secondary/15 text-xs sm:text-sm font-medium transition-colors inline-flex items-center gap-1.5"
          >
            <i className="bi bi-arrow-left text-xs" />
            <span>Back to List</span>
          </button>
        }
      />

      {/* Top Header Card */}
      <div className="card-glow p-5 sm:p-6 rounded-2xl">
        <div className="flex flex-wrap justify-between items-start gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-2.5">
              <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-md bg-brand-primary text-white">
                {ticket.ticket_number}
              </span>
              <PriorityBadge priority={ticket.priority} />
              <StatusBadge status={ticket.status} />
              <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-medium bg-brand-secondary/15 text-brand-primary border border-brand-secondary/30">
                {ticket.category_name || 'General'}
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-bold text-brand-primary mb-2 leading-tight">
              {ticket.title}
            </h2>

            <div className="text-xs text-brand-secondary flex flex-wrap items-center gap-x-4 gap-y-1.5">
              <span>
                <i className="bi bi-person mr-1" />
                Requester: <b className="text-brand-primary">{ticket.requester_name}</b>
              </span>
              <span>
                <i className="bi bi-calendar3 mr-1" />
                Created: {new Date(ticket.created_at).toLocaleString()}
              </span>
              {ticket.department_name && (
                <span>
                  <i className="bi bi-building mr-1" />
                  Dept: {ticket.department_name}
                </span>
              )}
              {ticket.assignee_name && (
                <span>
                  <i className="bi bi-person-check mr-1" />
                  Assigned to: <b className="text-brand-primary">{ticket.assignee_name}</b>
                </span>
              )}
            </div>
          </div>

          {/* Workflow Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap flex-shrink-0">
            {canManageWorkflow && (
              <>
                <button
                  onClick={openAssignModal}
                  className="px-3.5 py-1.5 rounded-xl border border-brand-primary/30 bg-app-background text-brand-primary hover:bg-brand-secondary/15 text-xs sm:text-sm font-medium transition-colors inline-flex items-center gap-1.5"
                >
                  <i className="bi bi-person-plus text-xs" />
                  <span>Assign</span>
                </button>

                {ticket.status === 'NEW' && (
                  <button
                    onClick={() => {
                      setTargetStatus('IN_PROGRESS');
                      setShowTransitionModal(true);
                    }}
                    className="px-3.5 py-1.5 rounded-xl bg-brand-primary hover:bg-brand-primary/90 text-white text-xs sm:text-sm font-semibold transition-all inline-flex items-center gap-1.5"
                  >
                    <i className="bi bi-play-circle text-xs" />
                    <span>Start Progress</span>
                  </button>
                )}

                {['ASSIGNED', 'IN_PROGRESS', 'PENDING_CUSTOMER'].includes(ticket.status) && (
                  <button
                    onClick={() => {
                      setTargetStatus('RESOLVED');
                      setShowTransitionModal(true);
                    }}
                    className="px-3.5 py-1.5 rounded-xl bg-brand-primary hover:bg-brand-primary/90 text-white text-xs sm:text-sm font-semibold transition-all inline-flex items-center gap-1.5"
                  >
                    <i className="bi bi-check2-circle text-xs" />
                    <span>Resolve Ticket</span>
                  </button>
                )}
              </>
            )}

            {ticket.status === 'RESOLVED' && (
              <button
                onClick={() => {
                  setTargetStatus('CLOSED');
                  setShowTransitionModal(true);
                }}
                className="px-3.5 py-1.5 rounded-xl bg-brand-secondary hover:bg-brand-secondary/90 text-white text-xs sm:text-sm font-semibold transition-all inline-flex items-center gap-1.5"
              >
                <i className="bi bi-archive text-xs" />
                <span>Close Ticket</span>
              </button>
            )}

            {['RESOLVED', 'CLOSED'].includes(ticket.status) && (
              <button
                onClick={() => {
                  setTargetStatus('REOPENED');
                  setShowTransitionModal(true);
                }}
                className="px-3.5 py-1.5 rounded-xl border border-brand-primary/30 text-brand-primary hover:bg-brand-secondary/15 text-xs sm:text-sm font-medium transition-colors inline-flex items-center gap-1.5"
              >
                <i className="bi bi-arrow-clockwise text-xs" />
                <span>Reopen</span>
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Main Conversation & Timeline Column */}
        <div className="lg:col-span-8 space-y-6">
          {/* Ticket Description Card */}
          <div className="card-glow p-5 sm:p-6 rounded-2xl">
            <div className="flex items-center gap-2 pb-3 mb-3 border-b border-brand-primary/15">
              <i className="bi bi-file-text text-brand-primary text-lg" />
              <h3 className="font-bold text-sm text-brand-primary">
                Issue Description
              </h3>
            </div>
            <p className="text-sm text-brand-primary whitespace-pre-wrap leading-relaxed">
              {ticket.description}
            </p>
          </div>

          {/* Comment Stream */}
          <div className="card-glow p-5 sm:p-6 rounded-2xl">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-brand-primary/15">
              <div className="flex items-center gap-2">
                <i className="bi bi-chat-left-dots text-brand-primary text-lg" />
                <h3 className="font-bold text-sm text-brand-primary">
                  Conversation & Updates
                </h3>
              </div>
              <div className="flex items-center gap-2">
                {canManageWorkflow && (
                  <button
                    type="button"
                    onClick={handleSummarizeTicket}
                    className="px-2.5 py-1 rounded-lg text-xs font-medium text-brand-primary bg-brand-secondary/15 hover:bg-brand-secondary/25 border border-brand-secondary/30 transition-colors inline-flex items-center gap-1.5"
                  >
                    <i className="bi bi-card-text text-xs" />
                    <span>Summarize</span>
                  </button>
                )}
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-brand-secondary/15 text-brand-primary border border-brand-secondary/30">
                  {comments.length} message{comments.length === 1 ? '' : 's'}
                </span>
              </div>
            </div>

            {comments.length === 0 ? (
              <div className="text-center py-8 text-brand-secondary">
                <i className="bi bi-chat-square-dots text-3xl block mb-1 text-brand-secondary/60" />
                <p className="text-xs">No responses yet. Send a message to the user below.</p>
              </div>
            ) : (
              <div className="space-y-3.5 mb-6">
                {comments.map((c) => (
                  <div
                    key={c.id}
                    className={`p-4 rounded-xl border transition-colors ${c.is_internal
                      ? 'bg-brand-secondary/15 border-brand-secondary/40'
                      : 'bg-app-background border-brand-primary/15'
                      }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <div className="w-7 h-7 rounded-full bg-brand-primary text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                          {c.author_name ? c.author_name[0].toUpperCase() : 'U'}
                        </div>
                        <span className="font-semibold text-xs text-brand-primary">
                          {c.author_name}
                        </span>
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-brand-secondary/20 text-brand-primary">
                          {c.author_role}
                        </span>
                        {c.is_internal && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-brand-primary text-white inline-flex items-center gap-1">
                            <i className="bi bi-eye-slash-fill text-[9px]" />
                            <span>Internal Note</span>
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-brand-secondary flex-shrink-0">
                        {new Date(c.created_at).toLocaleString()}
                      </span>
                    </div>
                    <div className="text-xs sm:text-sm text-brand-primary whitespace-pre-wrap leading-relaxed pl-9">
                      {c.content}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Add Comment Composer */}
            <form onSubmit={handleCommentSubmit} className="pt-4 border-t border-brand-primary/15">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-brand-primary">
                  Add a Response
                </label>
                {canManageWorkflow && (
                  <button
                    type="button"
                    disabled={aiDraftLoading}
                    onClick={handleAIAssistInsert}
                    className="px-3 py-1 rounded-full text-xs font-semibold text-brand-primary bg-brand-secondary/20 hover:bg-brand-accent/30 border border-brand-secondary/40 transition-colors inline-flex items-center gap-1.5"
                  >
                    {aiDraftLoading ? (
                      <>
                        <span className="w-3 h-3 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
                        <span>Drafting with Local RAG...</span>
                      </>
                    ) : (
                      <>
                        <i className="bi bi-stars text-brand-primary" />
                        <span>Draft Response with AI</span>
                      </>
                    )}
                  </button>
                )}
              </div>

              <textarea
                rows={4}
                required
                className="w-full px-3.5 py-2.5 text-sm bg-app-background border border-brand-secondary/40 rounded-xl text-brand-primary placeholder:text-brand-secondary/60 focus:outline-none focus:ring-2 focus:ring-brand-accent/40 focus:border-brand-primary transition-colors mb-2 resize-y"
                placeholder="Type a helpful response to the requester..."
                value={commentContent}
                onChange={(e) => setCommentContent(e.target.value)}
              />

              {commentContent && (
                <div className="flex items-center gap-1.5 mb-3 text-[11px] text-brand-secondary">
                  <i className="bi bi-shield-check text-brand-primary" />
                  <span>Human-in-the-loop: Review and adjust AI suggestions before posting.</span>
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-3">
                {canManageWorkflow ? (
                  <label className="inline-flex items-center gap-2 text-xs font-medium text-brand-primary cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={isInternal}
                      onChange={(e) => setIsInternal(e.target.checked)}
                      className="rounded border-brand-secondary text-brand-primary focus:ring-brand-accent/40"
                    />
                    <i className="bi bi-lock-fill text-brand-primary" />
                    <span>Post as Internal Note (Hidden from requester)</span>
                  </label>
                ) : (
                  <div />
                )}

                <button
                  type="submit"
                  disabled={submittingComment}
                  className="px-4 py-2 bg-brand-primary hover:bg-brand-primary/90 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-subtle transition-all inline-flex items-center gap-2 disabled:opacity-50"
                >
                  {submittingComment ? (
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <i className="bi bi-send-fill" />
                      <span>Send Reply</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Audit History Timeline */}
          <div className="card-glow p-5 sm:p-6 rounded-2xl">
            <div className="flex items-center gap-2 pb-3 mb-3 border-b border-brand-primary/15">
              <i className="bi bi-clock-history text-brand-primary text-lg" />
              <h3 className="font-bold text-sm text-brand-primary">
                System Audit Trail & History
              </h3>
            </div>
            <div className="divide-y divide-brand-primary/10">
              {history.length === 0 ? (
                <div className="text-center py-6 text-xs text-brand-secondary">
                  No audit events recorded yet.
                </div>
              ) : (
                history.map((ev) => (
                  <div key={ev.id} className="py-3 flex flex-wrap items-start justify-between gap-2 text-xs">
                    <div>
                      <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-brand-secondary/15 text-brand-primary border border-brand-secondary/30 mr-2">
                        {ev.event_type}
                      </span>
                      <span className="font-semibold text-brand-primary">
                        {ev.actor_name || 'System'}:{' '}
                      </span>
                      <span className="text-brand-secondary">
                        {ev.old_value && `from "${ev.old_value}" `}
                        {ev.new_value && `to "${ev.new_value}"`}
                      </span>
                    </div>
                    <span className="text-[11px] text-brand-secondary flex-shrink-0">
                      {new Date(ev.created_at).toLocaleString()}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Info Column (AI Predictions, SLA Risk, Assignment) */}
        <div className="lg:col-span-4 space-y-5">
          {/* SLA Tracking Info Card */}
          <div className="card-glow p-5 rounded-2xl space-y-3.5">
            <div className="flex items-center gap-2 pb-3 border-b border-brand-primary/15">
              <i className="bi bi-stopwatch text-brand-primary text-lg" />
              <h3 className="font-bold text-sm text-brand-primary">
                SLA Status & Deadlines
              </h3>
            </div>
            <div>
              <span className="text-[11px] text-brand-secondary uppercase tracking-wider block mb-1">
                Applied SLA Policy
              </span>
              <span className="font-semibold text-sm text-brand-primary">
                {ticket.sla_info?.policy_name || 'Standard Organization SLA'}
              </span>
            </div>
            <div>
              <span className="text-[11px] text-brand-secondary uppercase tracking-wider block mb-1">
                Resolution Deadline
              </span>
              <span className="font-semibold text-sm text-brand-primary">
                {ticket.resolution_due_at
                  ? new Date(ticket.resolution_due_at).toLocaleString()
                  : 'Target not calculated'}
              </span>
            </div>
            <div>
              <span className="text-[11px] text-brand-secondary uppercase tracking-wider block mb-1">
                Current Breach Status
              </span>
              {ticket.is_sla_breached ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-brand-primary text-white border border-brand-primary shadow-subtle">
                  <i className="bi bi-exclamation-triangle-fill text-brand-accent text-xs" />
                  <span>SLA Breached</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-brand-secondary/20 text-brand-primary border border-brand-secondary/40">
                  <i className="bi bi-check-circle text-xs" />
                  <span>Within Target Window</span>
                </span>
              )}
            </div>
          </div>

          {/* AI Predictions & Classification Panel */}
          {ticket.latest_ai_prediction && (
            <div className="card-glow p-5 rounded-2xl space-y-3.5">
              <div className="flex items-center justify-between pb-3 border-b border-brand-primary/15">
                <div className="flex items-center gap-2">
                  <i className="bi bi-cpu text-brand-primary text-lg" />
                  <h3 className="font-bold text-sm text-brand-primary">
                    AI Insights
                  </h3>
                </div>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-brand-secondary/20 text-brand-primary border border-brand-secondary/35">
                  {ticket.latest_ai_prediction.model_name}
                </span>
              </div>

              <div>
                <span className="text-[11px] text-brand-secondary uppercase tracking-wider block mb-1">
                  Predicted Category
                </span>
                <span className="font-bold text-sm text-brand-primary">
                  {ticket.latest_ai_prediction.predicted_category_name || 'General'}
                </span>
              </div>

              <div>
                <span className="text-[11px] text-brand-secondary uppercase tracking-wider block mb-1">
                  Predicted Priority
                </span>
                <PriorityBadge
                  priority={ticket.latest_ai_prediction.predicted_priority || 'MEDIUM'}
                />
              </div>

              {ticket.latest_ai_prediction.rationale && (
                <div>
                  <span className="text-[11px] text-brand-secondary uppercase tracking-wider block mb-1">
                    Decision Rationale
                  </span>
                  <p className="text-xs p-3 rounded-xl bg-brand-secondary/10 text-brand-primary border border-brand-secondary/30 leading-relaxed">
                    {ticket.latest_ai_prediction.rationale}
                  </p>
                </div>
              )}

              <div className="flex items-center justify-between pt-3 border-t border-brand-primary/15 text-xs">
                <span className="text-brand-secondary">Feedback:</span>
                {feedbackSent ? (
                  <span className="text-brand-primary font-semibold inline-flex items-center gap-1">
                    <i className="bi bi-check2 text-brand-secondary" />
                    <span>Recorded</span>
                  </span>
                ) : (
                  <div className="inline-flex rounded-lg border border-brand-primary/25 overflow-hidden">
                    <button
                      type="button"
                      onClick={() => handleFeedback(true)}
                      className="px-2.5 py-1 text-xs text-brand-primary hover:bg-brand-secondary/15 transition-colors inline-flex items-center gap-1 border-r border-brand-primary/25"
                    >
                      <i className="bi bi-hand-thumbs-up" />
                      <span>Accurate</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleFeedback(false)}
                      className="px-2.5 py-1 text-xs text-brand-primary hover:bg-brand-secondary/15 transition-colors inline-flex items-center gap-1"
                    >
                      <i className="bi bi-hand-thumbs-down" />
                      <span>Inaccurate</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Predictive SLA Risk Analysis */}
          {ticket.latest_sla_risk && (
            <div className="card-glow p-5 rounded-2xl space-y-3.5">
              <div className="flex items-center gap-2 pb-3 border-b border-brand-primary/15">
                <i className="bi bi-graph-up-arrow text-brand-primary text-lg" />
                <h3 className="font-bold text-sm text-brand-primary">
                  Predictive SLA Risk Analysis
                </h3>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-brand-secondary">Breach Probability</span>
                <span
                  className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-brand-secondary/20 text-brand-primary border border-brand-secondary/35"
                >
                  {Math.round(ticket.latest_sla_risk.risk_score * 100)}% ({ticket.latest_sla_risk.risk_level})
                </span>
              </div>

              <div className="w-full bg-brand-secondary/20 h-2 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-300 bg-brand-primary"
                  style={{ width: `${Math.round(ticket.latest_sla_risk.risk_score * 100)}%` }}
                />
              </div>

              {ticket.latest_sla_risk.risk_factors?.length > 0 && (
                <div>
                  <span className="text-[11px] text-brand-secondary uppercase tracking-wider block mb-1">
                    Operational Factors
                  </span>
                  <ul className="text-xs list-disc list-inside text-brand-primary space-y-1">
                    {ticket.latest_sla_risk.risk_factors.map((f, i) => (
                      <li key={i}>{f}</li>
                    ))}
                  </ul>
                </div>
              )}

              {ticket.latest_sla_risk.suggested_mitigation && (
                <div className="p-3 rounded-xl bg-brand-secondary/10 border border-brand-secondary/30">
                  <span className="text-xs font-bold text-brand-primary block mb-0.5">
                    <i className="bi bi-lightbulb-fill text-brand-secondary mr-1" />
                    Suggested Mitigation
                  </span>
                  <p className="text-xs text-brand-secondary leading-relaxed mb-0">
                    {ticket.latest_sla_risk.suggested_mitigation}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Similar Tickets Panel */}
          {canManageWorkflow && (
            <div className="card-glow p-5 rounded-2xl space-y-3.5">
              <div className="flex items-center justify-between pb-3 border-b border-brand-primary/15">
                <div className="flex items-center gap-2">
                  <i className="bi bi-files text-brand-primary text-lg" />
                  <h3 className="font-bold text-sm text-brand-primary">
                    Similar Tickets
                  </h3>
                </div>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-brand-secondary/20 text-brand-primary border border-brand-secondary/35">
                  TF-IDF Cosine
                </span>
              </div>

              {loadingSimilar ? (
                <div className="text-center py-4 text-xs text-brand-secondary">
                  <span className="w-3.5 h-3.5 border-2 border-brand-primary border-t-transparent rounded-full animate-spin inline-block mr-2" />
                  Scanning tenant incidents...
                </div>
              ) : similarTickets.length === 0 ? (
                <p className="text-xs text-brand-secondary py-2 m-0">
                  No similar historical incidents found above similarity threshold.
                </p>
              ) : (
                <div className="space-y-2.5">
                  {similarTickets.map((st) => (
                    <div
                      key={st.ticket_id}
                      onClick={() => navigate(`/tickets/${st.ticket_id}`)}
                      className="p-3 rounded-xl bg-app-background border border-brand-primary/15 hover:border-brand-primary/40 cursor-pointer transition-all space-y-1.5"
                    >
                      <div className="flex items-center justify-between gap-1.5">
                        <span className="font-mono text-[10px] font-bold text-brand-primary">
                          {st.ticket_number}
                        </span>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-brand-secondary/20 text-brand-primary">
                          {Math.round(st.similarity_score * 100)}% Match
                        </span>
                      </div>
                      <p className="text-xs font-medium text-brand-primary truncate m-0">
                        {st.title}
                      </p>
                      <div className="flex items-center justify-between text-[10px] text-brand-secondary">
                        <span>{st.status}</span>
                        <span>{st.category}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Transition Modal */}
      <ModernModal
        isOpen={showTransitionModal}
        onClose={() => setShowTransitionModal(false)}
        title="Update Ticket Status"
        subtitle={`Transitioning status from ${ticket.status} to ${targetStatus}`}
        footer={
          <>
            <button
              type="button"
              className="px-4 py-2 text-xs sm:text-sm font-medium rounded-xl border border-brand-primary/20 bg-app-background text-brand-primary hover:bg-brand-secondary/15 transition-colors"
              onClick={() => setShowTransitionModal(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleTransitionSubmit}
              className="px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-brand-primary hover:bg-brand-primary/90 text-white transition-all shadow-subtle"
            >
              Confirm Status Transition
            </button>
          </>
        }
      >
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-brand-primary mb-1.5">
            Optional Resolution Note / Transition Comment
          </label>
          <textarea
            rows={3}
            className="w-full px-3.5 py-2.5 text-sm bg-app-background border border-brand-secondary/40 rounded-xl text-brand-primary placeholder:text-brand-secondary/60 focus:outline-none focus:ring-2 focus:ring-brand-accent/40 focus:border-brand-primary transition-colors resize-y"
            placeholder="Enter reason or summary for this status change..."
            value={transitionComment}
            onChange={(e) => setTransitionComment(e.target.value)}
          />
        </div>
      </ModernModal>

      {/* Assign Modal */}
      <ModernModal
        isOpen={showAssignModal}
        onClose={() => setShowAssignModal(false)}
        title="Assign Ticket Incident"
        subtitle="Route this ticket to an individual support agent or responsible team."
        footer={
          <>
            <button
              type="button"
              className="px-4 py-2 text-xs sm:text-sm font-medium rounded-xl border border-brand-primary/20 bg-app-background text-brand-primary hover:bg-brand-secondary/15 transition-colors"
              onClick={() => setShowAssignModal(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleAssignSubmit}
              className="px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-brand-primary hover:bg-brand-primary/90 text-white transition-all shadow-subtle"
            >
              Save Assignment
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-brand-primary mb-1.5">
              Assign to Support Agent
            </label>
            <select
              className="w-full px-3.5 py-2.5 text-sm bg-app-background border border-brand-secondary/40 rounded-xl text-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-accent/40 focus:border-brand-primary transition-colors cursor-pointer"
              value={selectedAgentId}
              onChange={(e) => setSelectedAgentId(e.target.value)}
            >
              <option value="">Select Agent...</option>
              {availableAgents.map((ag) => (
                <option key={ag.id} value={ag.id}>
                  {ag.full_name} ({ag.email})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-brand-primary mb-1.5">
              Assign to Department / Team
            </label>
            <select
              className="w-full px-3.5 py-2.5 text-sm bg-app-background border border-brand-secondary/40 rounded-xl text-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-accent/40 focus:border-brand-primary transition-colors cursor-pointer"
              value={selectedTeamId}
              onChange={(e) => setSelectedTeamId(e.target.value)}
            >
              <option value="">Select Team...</option>
              {availableTeams.map((tm) => (
                <option key={tm.id} value={tm.id}>
                  {tm.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-brand-primary mb-1.5">
              Assignment Reason
            </label>
            <input
              type="text"
              className="w-full px-3.5 py-2.5 text-sm bg-app-background border border-brand-secondary/40 rounded-xl text-brand-primary placeholder:text-brand-secondary/60 focus:outline-none focus:ring-2 focus:ring-brand-accent/40 focus:border-brand-primary transition-colors"
              placeholder="e.g. Specialized in Network & VPN troubleshooting"
              value={assignReason}
              onChange={(e) => setAssignReason(e.target.value)}
            />
          </div>
        </div>
      </ModernModal>

      {/* Conversation Summary Modal */}
      <ModernModal
        isOpen={showSummaryModal}
        onClose={() => setShowSummaryModal(false)}
        title="Ticket Conversation Summary"
        subtitle={`Summary of incident ${ticket.ticket_number} and all thread updates`}
        footer={
          <button
            type="button"
            className="px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-brand-primary hover:bg-brand-primary/90 text-white transition-all shadow-subtle"
            onClick={() => setShowSummaryModal(false)}
          >
            Close
          </button>
        }
      >
        <div className="space-y-3">
          {summaryLoading ? (
            <div className="text-center py-8">
              <span className="w-6 h-6 border-2 border-brand-primary border-t-transparent rounded-full animate-spin inline-block mb-2" />
              <p className="text-xs text-brand-secondary">Generating extractive conversation summary...</p>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-brand-secondary/10 border border-brand-secondary/30 text-xs sm:text-sm text-brand-primary whitespace-pre-wrap leading-relaxed">
              {summaryText}
            </div>
          )}
        </div>
      </ModernModal>
    </div>
  );
};
