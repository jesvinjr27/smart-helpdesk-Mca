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
import { CardSkeleton, TableSkeleton } from '../../components/common/LoadingSkeleton';

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
      console.error('Failed to fetch agents/teams:', err);
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

  const handleAIAssistInsert = async () => {
    setAiDraftLoading(true);
    try {
      const resp = await generateAIAssistApi({
        ticket_id: ticket.id,
        query: `${ticket.title}\n${ticket.description}`,
        tone: 'professional',
      });
      setCommentContent(resp.data.suggested_response);
    } catch (err) {
      alert('AI assist service unavailable');
    } finally {
      setAiDraftLoading(false);
    }
  };

  const handleFeedback = async (isAccepted) => {
    if (!ticket?.latest_ai_prediction?.id) return;
    try {
      await submitAIFeedbackApi(ticket.id, {
        prediction_id: ticket.latest_ai_prediction.id,
        is_category_accepted: isAccepted,
        is_priority_accepted: isAccepted,
        feedback_notes: isAccepted ? 'Confirmed by agent' : 'Incorrect classification reported',
        rating: isAccepted ? 5 : 2,
      });
      setFeedbackSent(true);
    } catch (err) {
      console.error('Failed to submit feedback:', err);
    }
  };

  if (loading) {
    return (
      <div>
        <PageHeader title="Ticket Details" subtitle="Loading incident information..." />
        <CardSkeleton className="mb-4" height="120px" />
        <div className="row g-4">
          <div className="col-lg-8"><CardSkeleton height="350px" /></div>
          <div className="col-lg-4"><CardSkeleton height="350px" /></div>
        </div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="alert alert-danger py-4 text-center rounded-3">
        <i className="bi bi-exclamation-triangle fs-2 d-block mb-2"></i>
        <h6>Ticket not found or permission denied</h6>
        <p className="text-sm mb-3">The requested ticket does not exist or your account lacks viewing privileges.</p>
        <button onClick={() => navigate('/tickets')} className="btn btn-outline-danger btn-sm">
          Return to Tickets
        </button>
      </div>
    );
  }

  return (
    <div>
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
            className="btn btn-outline-secondary btn-sm rounded-3 px-3"
          >
            <i className="bi bi-arrow-left me-1"></i>Back to List
          </button>
        }
      />

      {/* Top Header Card */}
      <div className="card shadow-sm mb-4">
        <div className="card-body p-4">
          <div className="d-flex flex-wrap justify-content-between align-items-start gap-3">
            <div>
              <div className="d-flex flex-wrap align-items-center gap-2 mb-2.5">
                <span className="badge bg-primary text-white font-monospace fs-6 px-2.5 py-1">
                  {ticket.ticket_number}
                </span>
                <PriorityBadge priority={ticket.priority} />
                <StatusBadge status={ticket.status} />
                <span className="badge bg-surface-subtle text-primary-emphasis border border-default">
                  {ticket.category_name || 'General'}
                </span>
              </div>

              <h4 className="fw-bold text-primary-emphasis mb-2">{ticket.title}</h4>

              <div className="text-muted text-xs d-flex flex-wrap align-items-center gap-3">
                <span>
                  <i className="bi bi-person me-1"></i>Requester:{' '}
                  <b className="text-primary-emphasis">{ticket.requester_name}</b>
                </span>
                <span>
                  <i className="bi bi-calendar3 me-1"></i>Created:{' '}
                  {new Date(ticket.created_at).toLocaleString()}
                </span>
                {ticket.department_name && (
                  <span>
                    <i className="bi bi-building me-1"></i>Dept: {ticket.department_name}
                  </span>
                )}
                {ticket.assignee_name && (
                  <span>
                    <i className="bi bi-person-check me-1"></i>Assigned to:{' '}
                    <b className="text-primary-emphasis">{ticket.assignee_name}</b>
                  </span>
                )}
              </div>
            </div>

            {/* Workflow Action Buttons */}
            <div className="d-flex flex-wrap gap-2">
              {canManageWorkflow && (
                <>
                  <button
                    onClick={openAssignModal}
                    className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1.5"
                  >
                    <i className="bi bi-person-plus"></i>
                    <span>Assign</span>
                  </button>

                  {ticket.status === 'NEW' && (
                    <button
                      onClick={() => {
                        setTargetStatus('IN_PROGRESS');
                        setShowTransitionModal(true);
                      }}
                      className="btn btn-primary btn-sm d-flex align-items-center gap-1.5"
                    >
                      <i className="bi bi-play-circle"></i>
                      <span>Start Progress</span>
                    </button>
                  )}

                  {['ASSIGNED', 'IN_PROGRESS', 'PENDING_CUSTOMER'].includes(ticket.status) && (
                    <button
                      onClick={() => {
                        setTargetStatus('RESOLVED');
                        setShowTransitionModal(true);
                      }}
                      className="btn btn-success btn-sm d-flex align-items-center gap-1.5"
                    >
                      <i className="bi bi-check2-circle"></i>
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
                  className="btn btn-secondary btn-sm d-flex align-items-center gap-1.5"
                >
                  <i className="bi bi-archive"></i>
                  <span>Close Ticket</span>
                </button>
              )}

              {['RESOLVED', 'CLOSED'].includes(ticket.status) && (
                <button
                  onClick={() => {
                    setTargetStatus('REOPENED');
                    setShowTransitionModal(true);
                  }}
                  className="btn btn-outline-danger btn-sm d-flex align-items-center gap-1.5"
                >
                  <i className="bi bi-arrow-clockwise"></i>
                  <span>Reopen</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="row g-4">
        {/* Main Conversation & Timeline Column */}
        <div className="col-lg-8">
          {/* Ticket Description Card */}
          <div className="card shadow-sm mb-4">
            <div className="card-header py-3 d-flex align-items-center justify-content-between">
              <div className="d-flex align-items-center gap-2">
                <i className="bi bi-file-text text-primary fs-5"></i>
                <h6 className="fw-bold mb-0 text-primary-emphasis">Issue Description</h6>
              </div>
            </div>
            <div className="card-body">
              <p
                className="mb-0 text-primary-emphasis text-sm"
                style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}
              >
                {ticket.description}
              </p>
            </div>
          </div>

          {/* Comment Stream */}
          <div className="card shadow-sm mb-4">
            <div className="card-header py-3 d-flex justify-content-between align-items-center">
              <div className="d-flex align-items-center gap-2">
                <i className="bi bi-chat-left-dots text-primary fs-5"></i>
                <h6 className="fw-bold mb-0 text-primary-emphasis">Conversation & Updates</h6>
              </div>
              <span className="badge bg-surface-subtle text-muted border border-default">
                {comments.length} message{comments.length === 1 ? '' : 's'}
              </span>
            </div>

            <div className="card-body p-4">
              {comments.length === 0 ? (
                <div className="text-center py-4 text-muted">
                  <i className="bi bi-chat-square-dots fs-3 text-secondary d-block mb-1"></i>
                  <p className="text-sm mb-0">No responses yet. Send a message to the user below.</p>
                </div>
              ) : (
                <div className="d-flex flex-column gap-3 mb-4">
                  {comments.map((c) => (
                    <div
                      key={c.id}
                      className={`comment-card ${c.is_internal ? 'internal' : ''}`}
                    >
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <div className="d-flex align-items-center gap-2">
                          <div className="comment-avatar">
                            {c.author_name ? c.author_name[0].toUpperCase() : 'U'}
                          </div>
                          <div>
                            <span className="fw-semibold text-sm text-primary-emphasis">
                              {c.author_name}
                            </span>
                            <span className="badge bg-secondary-subtle text-secondary text-xs ms-1.5">
                              {c.author_role}
                            </span>
                          </div>
                          {c.is_internal && (
                            <span className="badge bg-warning text-dark text-xs fw-bold ms-1">
                              <i className="bi bi-eye-slash-fill me-1"></i>Internal Note
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-muted">
                          {new Date(c.created_at).toLocaleString()}
                        </span>
                      </div>
                      <div
                        className="text-sm text-primary-emphasis ps-4 ms-2"
                        style={{ whiteSpace: 'pre-wrap', lineHeight: 1.5 }}
                      >
                        {c.content}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Add Comment Composer */}
              <form onSubmit={handleCommentSubmit} className="pt-3 border-top border-subtle">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <label className="form-label mb-0">Add a Response</label>
                  {canManageWorkflow && (
                    <button
                      type="button"
                      disabled={aiDraftLoading}
                      onClick={handleAIAssistInsert}
                      className="btn btn-sm btn-outline-primary d-flex align-items-center gap-1.5 py-1 px-3 rounded-pill text-xs fw-semibold"
                    >
                      {aiDraftLoading ? (
                        <>
                          <span className="spinner-border spinner-border-sm" role="status"></span>
                          <span>Drafting with Local RAG...</span>
                        </>
                      ) : (
                        <>
                          <i className="bi bi-stars"></i>
                          <span>Draft Response with AI</span>
                        </>
                      )}
                    </button>
                  )}
                </div>

                <textarea
                  rows={4}
                  required
                  className="form-control mb-3"
                  placeholder="Type a helpful response to the requester..."
                  value={commentContent}
                  onChange={(e) => setCommentContent(e.target.value)}
                ></textarea>

                <div className="d-flex flex-wrap justify-content-between align-items-center gap-2">
                  <div>
                    {canManageWorkflow && (
                      <div className="form-check">
                        <input
                          type="checkbox"
                          id="internalNoteCheck"
                          className="form-check-input"
                          checked={isInternal}
                          onChange={(e) => setIsInternal(e.target.checked)}
                        />
                        <label
                          htmlFor="internalNoteCheck"
                          className="form-check-label text-xs fw-medium text-muted cursor-pointer"
                        >
                          <i className="bi bi-lock-fill me-1 text-warning"></i>
                          Post as Internal Note (Hidden from requester)
                        </label>
                      </div>
                    )}
                  </div>
                  <button
                    type="submit"
                    disabled={submittingComment}
                    className="btn btn-primary px-4 fw-medium shadow-sm d-flex align-items-center gap-2"
                  >
                    {submittingComment ? (
                      <span className="spinner-border spinner-border-sm" role="status"></span>
                    ) : (
                      <>
                        <i className="bi bi-send-fill"></i>
                        <span>Send Reply</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Audit History Timeline */}
          <div className="card shadow-sm">
            <div className="card-header py-3 d-flex align-items-center gap-2">
              <i className="bi bi-clock-history text-secondary fs-5"></i>
              <h6 className="fw-bold mb-0 text-primary-emphasis">System Audit Trail & History</h6>
            </div>
            <div className="card-body p-0">
              <div className="list-group list-group-flush">
                {history.length === 0 ? (
                  <div className="text-center py-4 text-muted text-xs">No audit events recorded yet.</div>
                ) : (
                  history.map((ev) => (
                    <div key={ev.id} className="list-group-item py-3 px-4 border-subtle">
                      <div className="d-flex justify-content-between align-items-start">
                        <div>
                          <span className="badge bg-surface-subtle text-muted border border-default me-2 font-monospace text-xs">
                            {ev.event_type}
                          </span>
                          <span className="text-sm fw-semibold text-primary-emphasis">
                            {ev.actor_name || 'System'}:{' '}
                          </span>
                          <span className="text-sm text-secondary">
                            {ev.old_value && `from "${ev.old_value}" `}
                            {ev.new_value && `to "${ev.new_value}"`}
                          </span>
                        </div>
                        <span className="text-xs text-muted">
                          {new Date(ev.created_at).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Info Column (AI Predictions, SLA Risk, Assignment) */}
        <div className="col-lg-4">
          {/* SLA Tracking Info Card */}
          <div className="card shadow-sm mb-4">
            <div className="card-header py-3 d-flex align-items-center gap-2">
              <i className="bi bi-stopwatch text-danger fs-5"></i>
              <h6 className="fw-bold mb-0 text-primary-emphasis">SLA Status & Deadlines</h6>
            </div>
            <div className="card-body">
              <div className="mb-3">
                <span className="text-xs text-muted d-block mb-1">Applied SLA Policy</span>
                <span className="fw-semibold text-sm text-primary-emphasis">
                  {ticket.sla_info?.policy_name || 'Standard Organization SLA'}
                </span>
              </div>
              <div className="mb-3">
                <span className="text-xs text-muted d-block mb-1">Resolution Deadline</span>
                <span className="fw-semibold text-sm text-primary-emphasis">
                  {ticket.resolution_due_at
                    ? new Date(ticket.resolution_due_at).toLocaleString()
                    : 'Target not calculated'}
                </span>
              </div>
              <div>
                <span className="text-xs text-muted d-block mb-1">Current Breach Status</span>
                {ticket.is_sla_breached ? (
                  <span className="badge bg-danger text-white py-1.5 px-2.5 d-inline-flex align-items-center gap-1.5">
                    <span className="pulse-danger"></span> SLA Breached
                  </span>
                ) : (
                  <span className="badge bg-success-subtle text-success py-1.5 px-2.5">
                    <i className="bi bi-check-circle me-1"></i>Within Target Window
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* AI Predictions & Classification Panel */}
          {ticket.latest_ai_prediction && (
            <div className="card shadow-sm mb-4 border-default">
              <div className="card-header py-3 d-flex align-items-center justify-content-between border-subtle">
                <div className="d-flex align-items-center gap-2">
                  <i className="bi bi-cpu text-primary fs-5"></i>
                  <h6 className="fw-bold mb-0 text-primary-emphasis">AI Machine Learning Insights</h6>
                </div>
                <span className="badge bg-primary-subtle text-primary border border-primary-border text-xs">
                  {ticket.latest_ai_prediction.model_name}
                </span>
              </div>
              <div className="card-body">
                <div className="mb-2.5">
                  <span className="text-xs text-muted d-block mb-1">Predicted Category</span>
                  <span className="fw-bold text-primary-emphasis text-sm">
                    {ticket.latest_ai_prediction.predicted_category_name || 'General'}
                  </span>
                </div>

                <div className="mb-2.5">
                  <span className="text-xs text-muted d-block mb-1">Predicted Priority</span>
                  <PriorityBadge
                    priority={ticket.latest_ai_prediction.predicted_priority || 'MEDIUM'}
                  />
                </div>

                {ticket.latest_ai_prediction.rationale && (
                  <div className="mb-3">
                    <span className="text-xs text-muted d-block mb-1">Decision Rationale</span>
                    <p
                      className="text-xs p-2.5 rounded-3 mb-0 text-secondary border border-subtle"
                      style={{ backgroundColor: 'var(--bg-surface-subtle)' }}
                    >
                      {ticket.latest_ai_prediction.rationale}
                    </p>
                  </div>
                )}

                <div className="d-flex align-items-center justify-content-between pt-2.5 border-top border-subtle">
                  <span className="text-xs text-muted">Feedback accuracy:</span>
                  {feedbackSent ? (
                    <span className="text-success text-xs fw-semibold">
                      <i className="bi bi-check2 me-1"></i>Recorded
                    </span>
                  ) : (
                    <div className="btn-group btn-group-sm">
                      <button
                        onClick={() => handleFeedback(true)}
                        className="btn btn-outline-success btn-sm py-1 px-2.5"
                        title="Prediction was accurate"
                      >
                        <i className="bi bi-hand-thumbs-up me-1"></i>Accurate
                      </button>
                      <button
                        onClick={() => handleFeedback(false)}
                        className="btn btn-outline-danger btn-sm py-1 px-2.5"
                        title="Prediction was inaccurate"
                      >
                        <i className="bi bi-hand-thumbs-down me-1"></i>Inaccurate
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Predictive SLA Risk Analysis */}
          {ticket.latest_sla_risk && (
            <div className="card shadow-sm mb-4 border-default">
              <div className="card-header py-3 d-flex align-items-center gap-2">
                <i className="bi bi-graph-up-arrow text-warning fs-5"></i>
                <h6 className="fw-bold mb-0 text-primary-emphasis">Predictive SLA Risk Analysis</h6>
              </div>
              <div className="card-body">
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <span className="text-xs text-muted">Breach Risk Probability</span>
                  <span
                    className={`badge ${
                      ticket.latest_sla_risk.risk_level === 'CRITICAL'
                        ? 'bg-danger text-white'
                        : ticket.latest_sla_risk.risk_level === 'HIGH'
                        ? 'bg-warning text-dark'
                        : 'bg-info text-white'
                    }`}
                  >
                    {Math.round(ticket.latest_sla_risk.risk_score * 100)}% (
                    {ticket.latest_sla_risk.risk_level})
                  </span>
                </div>

                <div className="progress mb-3" style={{ height: '6px' }}>
                  <div
                    className={`progress-bar ${
                      ticket.latest_sla_risk.risk_score > 0.75
                        ? 'bg-danger'
                        : ticket.latest_sla_risk.risk_score > 0.4
                        ? 'bg-warning'
                        : 'bg-info'
                    }`}
                    style={{ width: `${Math.round(ticket.latest_sla_risk.risk_score * 100)}%` }}
                  ></div>
                </div>

                {ticket.latest_sla_risk.risk_factors?.length > 0 && (
                  <div className="mb-3">
                    <span className="text-xs text-muted d-block mb-1">Operational Factors</span>
                    <ul className="text-xs ps-3 mb-0 text-secondary">
                      {ticket.latest_sla_risk.risk_factors.map((f, i) => (
                        <li key={i}>{f}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {ticket.latest_sla_risk.suggested_mitigation && (
                  <div
                    className="p-2.5 rounded-3 border border-default"
                    style={{ backgroundColor: 'var(--bg-surface-subtle)' }}
                  >
                    <span className="text-xs fw-bold text-primary-emphasis d-block mb-0.5">
                      <i className="bi bi-lightbulb-fill text-warning me-1"></i>Suggested Mitigation
                    </span>
                    <span className="text-xs text-secondary">
                      {ticket.latest_sla_risk.suggested_mitigation}
                    </span>
                  </div>
                )}
              </div>
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
              className="btn btn-outline-secondary btn-sm"
              onClick={() => setShowTransitionModal(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleTransitionSubmit}
              className="btn btn-primary btn-sm px-3"
            >
              Confirm Status Transition
            </button>
          </>
        }
      >
        <div className="mb-3">
          <label className="form-label">Optional Resolution Note / Transition Comment</label>
          <textarea
            rows={3}
            className="form-control"
            placeholder="Enter reason or summary for this status change..."
            value={transitionComment}
            onChange={(e) => setTransitionComment(e.target.value)}
          ></textarea>
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
              className="btn btn-outline-secondary btn-sm"
              onClick={() => setShowAssignModal(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleAssignSubmit}
              className="btn btn-primary btn-sm px-3"
            >
              Save Assignment
            </button>
          </>
        }
      >
        <div className="mb-3">
          <label className="form-label">Assign to Support Agent</label>
          <select
            className="form-select"
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

        <div className="mb-3">
          <label className="form-label">Assign to Department / Team</label>
          <select
            className="form-select"
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

        <div className="mb-2">
          <label className="form-label">Assignment Reason</label>
          <input
            type="text"
            className="form-control"
            placeholder="e.g. Specialized in Network & VPN troubleshooting"
            value={assignReason}
            onChange={(e) => setAssignReason(e.target.value)}
          />
        </div>
      </ModernModal>
    </div>
  );
};
