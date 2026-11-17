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
    } catch (err) {
      console.error('Failed to load ticket details:', err);
    } finally {
      setLoading(false);
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
        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">Ticket not found</h3>
        <button
          onClick={() => navigate('/tickets')}
          className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm"
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
            className="px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs sm:text-sm font-medium transition-colors inline-flex items-center gap-1.5"
          >
            <i className="bi bi-arrow-left text-xs" />
            <span>Back to List</span>
          </button>
        }
      />

      {/* Top Header Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm">
        <div className="flex flex-wrap justify-between items-start gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-2.5">
              <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-md bg-blue-600 text-white">
                {ticket.ticket_number}
              </span>
              <PriorityBadge priority={ticket.priority} />
              <StatusBadge status={ticket.status} />
              <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                {ticket.category_name || 'General'}
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2 leading-tight">
              {ticket.title}
            </h2>

            <div className="text-xs text-slate-500 dark:text-slate-400 flex flex-wrap items-center gap-x-4 gap-y-1.5">
              <span>
                <i className="bi bi-person mr-1" />
                Requester: <b className="text-slate-700 dark:text-slate-200">{ticket.requester_name}</b>
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
                  Assigned to: <b className="text-slate-700 dark:text-slate-200">{ticket.assignee_name}</b>
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
                  className="px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs sm:text-sm font-medium transition-colors inline-flex items-center gap-1.5"
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
                    className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold transition-colors inline-flex items-center gap-1.5"
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
                    className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-semibold transition-colors inline-flex items-center gap-1.5"
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
                className="px-3.5 py-1.5 rounded-xl bg-slate-700 hover:bg-slate-800 text-white text-xs sm:text-sm font-semibold transition-colors inline-flex items-center gap-1.5"
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
                className="px-3.5 py-1.5 rounded-xl border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs sm:text-sm font-medium transition-colors inline-flex items-center gap-1.5"
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
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm">
            <div className="flex items-center gap-2 pb-3 mb-3 border-b border-slate-100 dark:border-slate-800">
              <i className="bi bi-file-text text-blue-600 text-lg" />
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                Issue Description
              </h3>
            </div>
            <p className="text-sm text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
              {ticket.description}
            </p>
          </div>

          {/* Comment Stream */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <i className="bi bi-chat-left-dots text-blue-600 text-lg" />
                <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                  Conversation & Updates
                </h3>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                {comments.length} message{comments.length === 1 ? '' : 's'}
              </span>
            </div>

            {comments.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <i className="bi bi-chat-square-dots text-3xl block mb-1 text-slate-300 dark:text-slate-600" />
                <p className="text-xs">No responses yet. Send a message to the user below.</p>
              </div>
            ) : (
              <div className="space-y-3.5 mb-6">
                {comments.map((c) => (
                  <div
                    key={c.id}
                    className={`p-4 rounded-xl border transition-colors ${
                      c.is_internal
                        ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/60'
                        : 'bg-slate-50/60 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                          {c.author_name ? c.author_name[0].toUpperCase() : 'U'}
                        </div>
                        <span className="font-semibold text-xs text-slate-900 dark:text-slate-100">
                          {c.author_name}
                        </span>
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-200/70 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                          {c.author_role}
                        </span>
                        {c.is_internal && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 inline-flex items-center gap-1">
                            <i className="bi bi-eye-slash-fill text-[9px]" />
                            <span>Internal Note</span>
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-400 flex-shrink-0">
                        {new Date(c.created_at).toLocaleString()}
                      </span>
                    </div>
                    <div className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed pl-9">
                      {c.content}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Add Comment Composer */}
            <form onSubmit={handleCommentSubmit} className="pt-4 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  Add a Response
                </label>
                {canManageWorkflow && (
                  <button
                    type="button"
                    disabled={aiDraftLoading}
                    onClick={handleAIAssistInsert}
                    className="px-3 py-1 rounded-full text-xs font-semibold text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800/80 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors inline-flex items-center gap-1.5"
                  >
                    {aiDraftLoading ? (
                      <>
                        <span className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                        <span>Drafting with Local RAG...</span>
                      </>
                    ) : (
                      <>
                        <i className="bi bi-stars" />
                        <span>Draft Response with AI</span>
                      </>
                    )}
                  </button>
                )}
              </div>

              <textarea
                rows={4}
                required
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors mb-3 resize-y"
                placeholder="Type a helpful response to the requester..."
                value={commentContent}
                onChange={(e) => setCommentContent(e.target.value)}
              />

              <div className="flex flex-wrap items-center justify-between gap-3">
                {canManageWorkflow ? (
                  <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-400 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={isInternal}
                      onChange={(e) => setIsInternal(e.target.checked)}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500/20"
                    />
                    <i className="bi bi-lock-fill text-amber-500" />
                    <span>Post as Internal Note (Hidden from requester)</span>
                  </label>
                ) : (
                  <div />
                )}

                <button
                  type="submit"
                  disabled={submittingComment}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-xs transition-colors inline-flex items-center gap-2 disabled:opacity-50"
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
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm">
            <div className="flex items-center gap-2 pb-3 mb-3 border-b border-slate-100 dark:border-slate-800">
              <i className="bi bi-clock-history text-slate-400 text-lg" />
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                System Audit Trail & History
              </h3>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {history.length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-400">
                  No audit events recorded yet.
                </div>
              ) : (
                history.map((ev) => (
                  <div key={ev.id} className="py-3 flex flex-wrap items-start justify-between gap-2 text-xs">
                    <div>
                      <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 mr-2">
                        {ev.event_type}
                      </span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {ev.actor_name || 'System'}:{' '}
                      </span>
                      <span className="text-slate-500 dark:text-slate-400">
                        {ev.old_value && `from "${ev.old_value}" `}
                        {ev.new_value && `to "${ev.new_value}"`}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400 flex-shrink-0">
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
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-3.5">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
              <i className="bi bi-stopwatch text-rose-500 text-lg" />
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                SLA Status & Deadlines
              </h3>
            </div>
            <div>
              <span className="text-[11px] text-slate-400 uppercase tracking-wider block mb-1">
                Applied SLA Policy
              </span>
              <span className="font-semibold text-sm text-slate-800 dark:text-slate-200">
                {ticket.sla_info?.policy_name || 'Standard Organization SLA'}
              </span>
            </div>
            <div>
              <span className="text-[11px] text-slate-400 uppercase tracking-wider block mb-1">
                Resolution Deadline
              </span>
              <span className="font-semibold text-sm text-slate-800 dark:text-slate-200">
                {ticket.resolution_due_at
                  ? new Date(ticket.resolution_due_at).toLocaleString()
                  : 'Target not calculated'}
              </span>
            </div>
            <div>
              <span className="text-[11px] text-slate-400 uppercase tracking-wider block mb-1">
                Current Breach Status
              </span>
              {ticket.is_sla_breached ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200 dark:border-rose-800/60">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
                  <span>SLA Breached</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60">
                  <i className="bi bi-check-circle text-xs" />
                  <span>Within Target Window</span>
                </span>
              )}
            </div>
          </div>

          {/* AI Predictions & Classification Panel */}
          {ticket.latest_ai_prediction && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-3.5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <i className="bi bi-cpu text-blue-600 text-lg" />
                  <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                    AI Insights
                  </h3>
                </div>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60">
                  {ticket.latest_ai_prediction.model_name}
                </span>
              </div>

              <div>
                <span className="text-[11px] text-slate-400 uppercase tracking-wider block mb-1">
                  Predicted Category
                </span>
                <span className="font-bold text-sm text-slate-800 dark:text-slate-200">
                  {ticket.latest_ai_prediction.predicted_category_name || 'General'}
                </span>
              </div>

              <div>
                <span className="text-[11px] text-slate-400 uppercase tracking-wider block mb-1">
                  Predicted Priority
                </span>
                <PriorityBadge
                  priority={ticket.latest_ai_prediction.predicted_priority || 'MEDIUM'}
                />
              </div>

              {ticket.latest_ai_prediction.rationale && (
                <div>
                  <span className="text-[11px] text-slate-400 uppercase tracking-wider block mb-1">
                    Decision Rationale
                  </span>
                  <p className="text-xs p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 leading-relaxed">
                    {ticket.latest_ai_prediction.rationale}
                  </p>
                </div>
              )}

              <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
                <span className="text-slate-400">Feedback:</span>
                {feedbackSent ? (
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold inline-flex items-center gap-1">
                    <i className="bi bi-check2" />
                    <span>Recorded</span>
                  </span>
                ) : (
                  <div className="inline-flex rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
                    <button
                      type="button"
                      onClick={() => handleFeedback(true)}
                      className="px-2.5 py-1 text-xs text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors inline-flex items-center gap-1 border-r border-slate-200 dark:border-slate-700"
                    >
                      <i className="bi bi-hand-thumbs-up" />
                      <span>Accurate</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleFeedback(false)}
                      className="px-2.5 py-1 text-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors inline-flex items-center gap-1"
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
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-3.5">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                <i className="bi bi-graph-up-arrow text-amber-500 text-lg" />
                <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                  Predictive SLA Risk Analysis
                </h3>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">Breach Probability</span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                    ticket.latest_sla_risk.risk_level === 'CRITICAL'
                      ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400'
                      : ticket.latest_sla_risk.risk_level === 'HIGH'
                      ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400'
                      : 'bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-400'
                  }`}
                >
                  {Math.round(ticket.latest_sla_risk.risk_score * 100)}% ({ticket.latest_sla_risk.risk_level})
                </span>
              </div>

              <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    ticket.latest_sla_risk.risk_score > 0.75
                      ? 'bg-rose-500'
                      : ticket.latest_sla_risk.risk_score > 0.4
                      ? 'bg-amber-500'
                      : 'bg-sky-500'
                  }`}
                  style={{ width: `${Math.round(ticket.latest_sla_risk.risk_score * 100)}%` }}
                />
              </div>

              {ticket.latest_sla_risk.risk_factors?.length > 0 && (
                <div>
                  <span className="text-[11px] text-slate-400 uppercase tracking-wider block mb-1">
                    Operational Factors
                  </span>
                  <ul className="text-xs list-disc list-inside text-slate-600 dark:text-slate-300 space-y-1">
                    {ticket.latest_sla_risk.risk_factors.map((f, i) => (
                      <li key={i}>{f}</li>
                    ))}
                  </ul>
                </div>
              )}

              {ticket.latest_sla_risk.suggested_mitigation && (
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100 block mb-0.5">
                    <i className="bi bi-lightbulb-fill text-amber-500 mr-1" />
                    Suggested Mitigation
                  </span>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-0">
                    {ticket.latest_sla_risk.suggested_mitigation}
                  </p>
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
              className="px-4 py-2 text-xs sm:text-sm font-medium rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              onClick={() => setShowTransitionModal(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleTransitionSubmit}
              className="px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-colors"
            >
              Confirm Status Transition
            </button>
          </>
        }
      >
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
            Optional Resolution Note / Transition Comment
          </label>
          <textarea
            rows={3}
            className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors resize-y"
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
              className="px-4 py-2 text-xs sm:text-sm font-medium rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              onClick={() => setShowAssignModal(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleAssignSubmit}
              className="px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-colors"
            >
              Save Assignment
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
              Assign to Support Agent
            </label>
            <select
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors cursor-pointer"
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
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
              Assign to Department / Team
            </label>
            <select
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors cursor-pointer"
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
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
              Assignment Reason
            </label>
            <input
              type="text"
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
              placeholder="e.g. Specialized in Network & VPN troubleshooting"
              value={assignReason}
              onChange={(e) => setAssignReason(e.target.value)}
            />
          </div>
        </div>
      </ModernModal>
    </div>
  );
};
