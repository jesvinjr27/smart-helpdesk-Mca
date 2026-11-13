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
  triggerTicketAIAnalysisApi,
  generateAIAssistApi,
  getUsersApi,
  getTeamsApi,
} from '../../api';

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
      <div className="d-flex justify-content-center py-5">
        <div className="spinner-border text-primary" role="status"></div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="alert alert-danger">
        Ticket not found or you do not have permission to view it.
      </div>
    );
  }

  return (
    <div>
      {/* Top Header Card */}
      <div className="card shadow-sm mb-4">
        <div className="card-body p-4">
          <div className="d-flex flex-wrap justify-content-between align-items-start gap-3">
            <div>
              <div className="d-flex align-items-center gap-2 mb-2">
                <span className="badge bg-primary fs-6 px-3 py-1 fw-bold">
                  {ticket.ticket_number}
                </span>
                <span className={`badge badge-priority-${ticket.priority.toLowerCase()}`}>
                  {ticket.priority} Priority
                </span>
                <span className={`badge badge-status badge-status-${ticket.status.toLowerCase()}`}>
                  {ticket.status.replace('_', ' ')}
                </span>
                <span className="badge bg-light text-dark border">
                  {ticket.category_name || 'General'}
                </span>
              </div>
              <h4 className="fw-bold text-dark mb-1">{ticket.title}</h4>
              <div className="text-muted text-xs d-flex flex-wrap align-items-center gap-3">
                <span>
                  <i className="bi bi-person me-1"></i>Requester: <b>{ticket.requester_name}</b>
                </span>
                <span>
                  <i className="bi bi-calendar me-1"></i>Created:{' '}
                  {new Date(ticket.created_at).toLocaleString()}
                </span>
                {ticket.department_name && (
                  <span>
                    <i className="bi bi-building me-1"></i>Dept: {ticket.department_name}
                  </span>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="d-flex flex-wrap gap-2">
              {canManageWorkflow && (
                <>
                  <button
                    onClick={openAssignModal}
                    className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1"
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
                      className="btn btn-primary btn-sm"
                    >
                      Start Progress
                    </button>
                  )}
                  {['ASSIGNED', 'IN_PROGRESS', 'PENDING_CUSTOMER'].includes(ticket.status) && (
                    <button
                      onClick={() => {
                        setTargetStatus('RESOLVED');
                        setShowTransitionModal(true);
                      }}
                      className="btn btn-success btn-sm"
                    >
                      Resolve Ticket
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
                  className="btn btn-secondary btn-sm"
                >
                  Close Ticket
                </button>
              )}

              {['RESOLVED', 'CLOSED'].includes(ticket.status) && (
                <button
                  onClick={() => {
                    setTargetStatus('REOPENED');
                    setShowTransitionModal(true);
                  }}
                  className="btn btn-outline-danger btn-sm"
                >
                  Reopen
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
            <div className="card-header bg-white py-3">
              <h6 className="fw-bold mb-0">Issue Description</h6>
            </div>
            <div className="card-body">
              <p className="mb-0 text-dark" style={{ whiteSpace: 'pre-wrap' }}>
                {ticket.description}
              </p>
            </div>
          </div>

          {/* Comment Stream */}
          <div className="card shadow-sm mb-4">
            <div className="card-header bg-white py-3 d-flex justify-content-between align-items-center">
              <h6 className="fw-bold mb-0">Conversation & Activity</h6>
              <span className="badge bg-light text-muted border">
                {comments.length} message{comments.length === 1 ? '' : 's'}
              </span>
            </div>
            <div className="card-body p-4">
              {comments.length === 0 ? (
                <div className="text-center py-4 text-muted">
                  <i className="bi bi-chat-square-dots fs-3 text-secondary d-block mb-1"></i>
                  No messages yet. Send a response below.
                </div>
              ) : (
                comments.map((c) => (
                  <div
                    key={c.id}
                    className={`comment-box ${c.is_internal ? 'internal' : 'public'}`}
                  >
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <div className="d-flex align-items-center gap-2">
                        <span className="fw-semibold text-sm">{c.author_name}</span>
                        <span className="badge bg-secondary-subtle text-secondary text-xs">
                          {c.author_role}
                        </span>
                        {c.is_internal && (
                          <span className="badge bg-warning text-dark text-xs fw-bold">
                            <i className="bi bi-eye-slash me-1"></i>Internal Agent Note
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-muted">
                        {new Date(c.created_at).toLocaleString()}
                      </span>
                    </div>
                    <div className="text-sm" style={{ whiteSpace: 'pre-wrap' }}>
                      {c.content}
                    </div>
                  </div>
                ))
              )}

              {/* Add Comment Composer */}
              <form onSubmit={handleCommentSubmit} className="mt-4 pt-3 border-top">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <label className="form-label fw-semibold text-sm mb-0">Add a Response</label>
                  {canManageWorkflow && (
                    <button
                      type="button"
                      disabled={aiDraftLoading}
                      onClick={handleAIAssistInsert}
                      className="btn btn-sm btn-outline-primary d-flex align-items-center gap-1 py-1 px-2 rounded-pill text-xs"
                    >
                      {aiDraftLoading ? (
                        <>
                          <span className="spinner-border spinner-border-sm" role="status"></span>
                          <span>Drafting with RAG...</span>
                        </>
                      ) : (
                        <>
                          <i className="bi bi-magic"></i>
                          <span>Insert AI Solution Draft</span>
                        </>
                      )}
                    </button>
                  )}
                </div>

                <textarea
                  rows={4}
                  required
                  className="form-control mb-3"
                  placeholder="Type your response to the user..."
                  value={commentContent}
                  onChange={(e) => setCommentContent(e.target.value)}
                ></textarea>

                <div className="d-flex justify-content-between align-items-center">
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
                          <i className="bi bi-lock me-1"></i>Post as Internal Agent Note (Hidden
                          from requester)
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
                        <i className="bi bi-send"></i>
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
            <div className="card-header bg-white py-3">
              <h6 className="fw-bold mb-0">System Audit Trail & History</h6>
            </div>
            <div className="card-body p-0">
              <div className="list-group list-group-flush">
                {history.map((ev) => (
                  <div key={ev.id} className="list-group-item py-3 px-4">
                    <div className="d-flex justify-content-between align-items-start">
                      <div>
                        <span className="badge bg-light text-dark border me-2">
                          {ev.event_type}
                        </span>
                        <span className="text-sm fw-medium">
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
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Info Column (AI Predictions, SLA Risk, Assignment) */}
        <div className="col-lg-4">
          {/* SLA Tracking Info Card */}
          <div className="card shadow-sm mb-4">
            <div className="card-header bg-white py-3">
              <h6 className="fw-bold mb-0">SLA Status & Deadlines</h6>
            </div>
            <div className="card-body">
              <div className="mb-3">
                <span className="text-xs text-muted d-block">Policy Applied</span>
                <span className="fw-medium text-sm">
                  {ticket.sla_info?.policy_name || 'Standard SLA'}
                </span>
              </div>
              <div className="mb-3">
                <span className="text-xs text-muted d-block">Resolution Due</span>
                <span className="fw-semibold text-sm">
                  {ticket.resolution_due_at
                    ? new Date(ticket.resolution_due_at).toLocaleString()
                    : 'Not calculated'}
                </span>
              </div>
              <div>
                <span className="text-xs text-muted d-block">Breach Status</span>
                {ticket.is_sla_breached ? (
                  <span className="badge bg-danger text-white py-1 px-2 d-inline-flex align-items-center gap-1">
                    <span className="pulse-danger"></span> SLA Breached
                  </span>
                ) : (
                  <span className="badge bg-success-subtle text-success py-1 px-2">
                    <i className="bi bi-check-circle me-1"></i>Within Target Window
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* AI Predictions & Classification Panel */}
          {ticket.latest_ai_prediction && (
            <div className="card shadow-sm mb-4 border-primary border-opacity-25">
              <div className="card-header bg-primary bg-opacity-10 py-3 d-flex align-items-center justify-content-between">
                <div className="d-flex align-items-center gap-2">
                  <i className="bi bi-cpu text-primary fs-5"></i>
                  <h6 className="fw-bold mb-0 text-primary">AI ML Classification</h6>
                </div>
                <span className="badge bg-light text-muted border text-xs">
                  {ticket.latest_ai_prediction.model_name}
                </span>
              </div>
              <div className="card-body">
                <div className="mb-2">
                  <span className="text-xs text-muted d-block">Predicted Category</span>
                  <span className="fw-bold text-dark text-sm">
                    {ticket.latest_ai_prediction.predicted_category_name || 'N/A'}
                  </span>
                </div>

                <div className="mb-2">
                  <span className="text-xs text-muted d-block">Predicted Priority</span>
                  <span
                    className={`badge badge-priority-${ticket.latest_ai_prediction.predicted_priority?.toLowerCase() || 'medium'}`}
                  >
                    {ticket.latest_ai_prediction.predicted_priority}
                  </span>
                </div>

                {ticket.latest_ai_prediction.rationale && (
                  <div className="mb-3">
                    <span className="text-xs text-muted d-block">Decision Rationale</span>
                    <p className="text-xs bg-light p-2 rounded-2 mb-0 text-secondary">
                      {ticket.latest_ai_prediction.rationale}
                    </p>
                  </div>
                )}

                <div className="d-flex align-items-center justify-content-between pt-2 border-top">
                  <span className="text-xs text-muted">Feedback accuracy:</span>
                  {feedbackSent ? (
                    <span className="text-success text-xs fw-semibold">
                      <i className="bi bi-check2 me-1"></i>Recorded
                    </span>
                  ) : (
                    <div className="btn-group btn-group-sm">
                      <button
                        onClick={() => handleFeedback(true)}
                        className="btn btn-outline-success btn-sm py-0 px-2"
                        title="Prediction was accurate"
                      >
                        <i className="bi bi-hand-thumbs-up"></i>
                      </button>
                      <button
                        onClick={() => handleFeedback(false)}
                        className="btn btn-outline-danger btn-sm py-0 px-2"
                        title="Prediction was inaccurate"
                      >
                        <i className="bi bi-hand-thumbs-down"></i>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* SLA Risk Prediction */}
          {ticket.latest_sla_risk && (
            <div className="card shadow-sm mb-4">
              <div className="card-header bg-white py-3">
                <h6 className="fw-bold mb-0">Predictive SLA Risk Analysis</h6>
              </div>
              <div className="card-body">
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <span className="text-xs text-muted">Breach Risk Probability</span>
                  <span
                    className={`badge ${
                      ticket.latest_sla_risk.risk_level === 'CRITICAL'
                        ? 'bg-danger'
                        : ticket.latest_sla_risk.risk_level === 'HIGH'
                        ? 'bg-warning text-dark'
                        : 'bg-info text-dark'
                    }`}
                  >
                    {Math.round(ticket.latest_sla_risk.risk_score * 100)}% (
                    {ticket.latest_sla_risk.risk_level})
                  </span>
                </div>

                {ticket.latest_sla_risk.risk_factors?.length > 0 && (
                  <div className="mb-2">
                    <span className="text-xs text-muted d-block mb-1">Operational Factors</span>
                    <ul className="text-xs ps-3 mb-0 text-secondary">
                      {ticket.latest_sla_risk.risk_factors.map((f, i) => (
                        <li key={i}>{f}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {ticket.latest_sla_risk.suggested_mitigation && (
                  <div className="mt-3 bg-light p-2 rounded-2">
                    <span className="text-xs fw-bold text-dark d-block">Suggested Action</span>
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
      {showTransitionModal && (
        <div
          className="modal fade show d-block"
          tabIndex="-1"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content rounded-4 border-0 shadow">
              <div className="modal-header border-0 pb-0">
                <h5 className="modal-title fw-bold">Update Ticket Status</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowTransitionModal(false)}
                ></button>
              </div>
              <div className="modal-body py-3">
                <p className="text-sm text-muted">
                  Moving ticket from <b>{ticket.status}</b> to <b>{targetStatus}</b>.
                </p>
                <div className="mb-3">
                  <label className="form-label text-sm fw-semibold">
                    Optional Resolution Note / Reason
                  </label>
                  <textarea
                    rows={3}
                    className="form-control"
                    placeholder="Enter notes about this status transition..."
                    value={transitionComment}
                    onChange={(e) => setTransitionComment(e.target.value)}
                  ></textarea>
                </div>
              </div>
              <div className="modal-footer border-0 pt-0">
                <button
                  type="button"
                  className="btn btn-light"
                  onClick={() => setShowTransitionModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleTransitionSubmit}
                  className="btn btn-primary"
                >
                  Confirm Transition
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Assign Modal */}
      {showAssignModal && (
        <div
          className="modal fade show d-block"
          tabIndex="-1"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content rounded-4 border-0 shadow">
              <div className="modal-header border-0 pb-0">
                <h5 className="modal-title fw-bold">Assign Ticket</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowAssignModal(false)}
                ></button>
              </div>
              <div className="modal-body py-3">
                <div className="mb-3">
                  <label className="form-label text-sm fw-semibold">Assign to Agent</label>
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
                  <label className="form-label text-sm fw-semibold">Assign to Team</label>
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

                <div className="mb-3">
                  <label className="form-label text-sm fw-semibold">Reason for Assignment</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Specialized in Network & VPN troubleshooting"
                    value={assignReason}
                    onChange={(e) => setAssignReason(e.target.value)}
                  />
                </div>
              </div>
              <div className="modal-footer border-0 pt-0">
                <button
                  type="button"
                  className="btn btn-light"
                  onClick={() => setShowAssignModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAssignSubmit}
                  className="btn btn-primary"
                >
                  Save Assignment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
