import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { getSLAPoliciesApi, getSLARisksApi, createSLAPolicyApi } from '../../api';

export const SLAManagementPage = () => {
  const navigate = useNavigate();
  const { hasRole } = useAuth();
  const isAdmin = hasRole(['ORG_ADMIN', 'SYS_ADMIN']);

  const [policies, setPolicies] = useState([]);
  const [risks, setRisks] = useState([]);
  const [loading, setLoading] = useState(true);

  // Policy Modal
  const [showPolicyModal, setShowPolicyModal] = useState(false);
  const [policyName, setPolicyName] = useState('');
  const [priority, setPriority] = useState('MEDIUM');
  const [respHours, setRespHours] = useState(4.0);
  const [resolHours, setResolHours] = useState(24.0);
  const [businessOnly, setBusinessOnly] = useState(true);
  const [savingPolicy, setSavingPolicy] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [pResp, rResp] = await Promise.all([
        getSLAPoliciesApi(),
        getSLARisksApi(),
      ]);
      setPolicies(pResp.data);
      setRisks(rResp.data);
    } catch (err) {
      console.error('Failed to load SLA data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSavePolicy = async (e) => {
    e.preventDefault();
    setSavingPolicy(true);
    try {
      await createSLAPolicyApi({
        name: policyName,
        priority,
        response_time_hours: parseFloat(respHours),
        resolution_time_hours: parseFloat(resolHours),
        business_hours_only: businessOnly,
        is_active: true,
      });
      setShowPolicyModal(false);
      setPolicyName('');
      await loadData();
    } catch (err) {
      alert('Failed to save SLA policy');
    } finally {
      setSavingPolicy(false);
    }
  };

  return (
    <div>
      {/* Page Header */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-2">
        <div>
          <h4 className="fw-bold mb-1">Service Level Agreements (SLA) & Risk Alerts</h4>
          <p className="text-muted text-sm mb-0">
            Monitor resolution deadlines, compliance rates, and real-time operational breach risks.
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowPolicyModal(true)}
            className="btn btn-primary btn-sm d-flex align-items-center gap-1 shadow-sm"
          >
            <i className="bi bi-plus-lg"></i>
            <span>Configure Policy</span>
          </button>
        )}
      </div>

      {/* At-Risk Live Monitor Table */}
      <div className="card shadow-sm mb-4 border-danger border-opacity-25">
        <div className="card-header bg-danger bg-opacity-10 py-3 d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center gap-2">
            <span className="pulse-danger"></span>
            <h6 className="fw-bold mb-0 text-danger">Real-Time Tickets at Risk of Breach</h6>
          </div>
          <span className="badge bg-danger text-white">{risks.length} Active Incidents</span>
        </div>
        <div className="card-body p-0">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-danger" role="status"></div>
            </div>
          ) : risks.length === 0 ? (
            <div className="text-center py-4 text-muted">
              <i className="bi bi-shield-check fs-2 text-success d-block mb-1"></i>
              All active tickets are safely within SLA targets!
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-custom table-hover mb-0">
                <thead>
                  <tr>
                    <th>Ticket #</th>
                    <th>Title</th>
                    <th>Priority</th>
                    <th>Time Remaining</th>
                    <th>Risk Score</th>
                    <th>Key Operational Factors</th>
                    <th>Suggested Mitigation</th>
                  </tr>
                </thead>
                <tbody>
                  {risks.map((r) => (
                    <tr
                      key={r.ticket_id}
                      className="cursor-pointer"
                      onClick={() => navigate(`/tickets/${r.ticket_id}`)}
                    >
                      <td className="fw-bold text-primary">{r.ticket_number}</td>
                      <td className="text-truncate" style={{ maxWidth: '220px' }}>
                        {r.title}
                      </td>
                      <td>
                        <span className={`badge badge-priority-${r.priority.toLowerCase()}`}>
                          {r.priority}
                        </span>
                      </td>
                      <td>
                        {r.time_remaining_minutes !== null ? (
                          r.time_remaining_minutes <= 0 ? (
                            <span className="badge bg-danger text-white">Breached</span>
                          ) : (
                            <span
                              className={`fw-bold text-sm ${
                                r.time_remaining_minutes < 60 ? 'text-danger' : 'text-dark'
                              }`}
                            >
                              {r.time_remaining_minutes >= 60
                                ? `${(r.time_remaining_minutes / 60).toFixed(1)} hrs`
                                : `${Math.round(r.time_remaining_minutes)} mins`}
                            </span>
                          )
                        ) : (
                          <span className="text-muted">N/A</span>
                        )}
                      </td>
                      <td>
                        <span
                          className={`badge ${
                            r.risk_level === 'CRITICAL'
                              ? 'bg-danger'
                              : r.risk_level === 'HIGH'
                              ? 'bg-warning text-dark'
                              : 'bg-info text-dark'
                          }`}
                        >
                          {Math.round(r.risk_score * 100)}% ({r.risk_level})
                        </span>
                      </td>
                      <td className="text-xs text-muted" style={{ maxWidth: '200px' }}>
                        {r.risk_factors?.join('; ') || 'Standard progression'}
                      </td>
                      <td className="text-xs fw-medium text-dark" style={{ maxWidth: '220px' }}>
                        {r.suggested_mitigation || 'Maintain standard pacing'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* SLA Policies Table */}
      <div className="card shadow-sm">
        <div className="card-header bg-white py-3">
          <h6 className="fw-bold mb-0">Configured Organization SLA Policies</h6>
        </div>
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-custom mb-0">
              <thead>
                <tr>
                  <th>Policy Name</th>
                  <th>Priority Level</th>
                  <th>First Response Target</th>
                  <th>Resolution Target</th>
                  <th>Business Hours Only</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {policies.map((p) => (
                  <tr key={p.id}>
                    <td className="fw-medium text-dark">{p.name}</td>
                    <td>
                      <span className={`badge badge-priority-${p.priority.toLowerCase()}`}>
                        {p.priority}
                      </span>
                    </td>
                    <td>{p.response_time_hours} hours</td>
                    <td className="fw-semibold">{p.resolution_time_hours} hours</td>
                    <td>
                      {p.business_hours_only ? (
                        <span className="badge bg-light text-dark border">Mon-Fri (9am-6pm)</span>
                      ) : (
                        <span className="badge bg-dark text-white">24/7 Continuous</span>
                      )}
                    </td>
                    <td>
                      <span className="badge bg-success-subtle text-success">Active</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Policy Modal */}
      {showPolicyModal && (
        <div
          className="modal fade show d-block"
          tabIndex="-1"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content rounded-4 border-0 shadow">
              <div className="modal-header border-bottom py-3">
                <h5 className="modal-title fw-bold">Configure SLA Policy</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowPolicyModal(false)}
                ></button>
              </div>
              <form onSubmit={handleSavePolicy}>
                <div className="modal-body p-4">
                  <div className="mb-3">
                    <label className="form-label text-sm fw-semibold">Policy Name</label>
                    <input
                      type="text"
                      required
                      className="form-control"
                      placeholder="e.g. Critical Incident SLA"
                      value={policyName}
                      onChange={(e) => setPolicyName(e.target.value)}
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label text-sm fw-semibold">Priority Level</label>
                    <select
                      className="form-select"
                      value={priority}
                      onChange={(e) => setPriority(e.target.value)}
                    >
                      <option value="CRITICAL">CRITICAL</option>
                      <option value="HIGH">HIGH</option>
                      <option value="MEDIUM">MEDIUM</option>
                      <option value="LOW">LOW</option>
                    </select>
                  </div>

                  <div className="row g-3 mb-3">
                    <div className="col-sm-6">
                      <label className="form-label text-sm fw-semibold">Response Target (Hrs)</label>
                      <input
                        type="number"
                        step="0.5"
                        required
                        className="form-control"
                        value={respHours}
                        onChange={(e) => setRespHours(e.target.value)}
                      />
                    </div>
                    <div className="col-sm-6">
                      <label className="form-label text-sm fw-semibold">Resolution Target (Hrs)</label>
                      <input
                        type="number"
                        step="0.5"
                        required
                        className="form-control"
                        value={resolHours}
                        onChange={(e) => setResolHours(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="form-check">
                    <input
                      type="checkbox"
                      id="businessCheck"
                      className="form-check-input"
                      checked={businessOnly}
                      onChange={(e) => setBusinessOnly(e.target.checked)}
                    />
                    <label htmlFor="businessCheck" className="form-check-label text-sm">
                      Apply business hours only (Pause timer during weekends)
                    </label>
                  </div>
                </div>
                <div className="modal-footer border-0 pt-0">
                  <button
                    type="button"
                    className="btn btn-light"
                    onClick={() => setShowPolicyModal(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" disabled={savingPolicy} className="btn btn-primary">
                    {savingPolicy ? 'Saving...' : 'Save Policy'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
