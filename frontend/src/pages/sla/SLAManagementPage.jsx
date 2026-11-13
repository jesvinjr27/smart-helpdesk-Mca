import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { getSLAPoliciesApi, getSLARisksApi, createSLAPolicyApi } from '../../api';
import { PriorityBadge } from '../../components/common/PriorityBadge';
import { PageHeader } from '../../components/common/PageHeader';
import { ModernModal } from '../../components/common/ModernModal';
import { EmptyState } from '../../components/common/EmptyState';
import { TableSkeleton } from '../../components/common/LoadingSkeleton';

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
      <PageHeader
        title="Service Level Agreements & Risk Monitoring"
        subtitle="Monitor operational deadlines, active breach probability warnings, and contractual service agreements."
        actions={
          isAdmin && (
            <button
              onClick={() => setShowPolicyModal(true)}
              className="btn btn-primary btn-sm d-flex align-items-center gap-1.5 shadow-sm"
            >
              <i className="bi bi-plus-lg"></i>
              <span>Configure SLA Policy</span>
            </button>
          )
        }
      />

      {/* At-Risk Live Monitor Table */}
      <div className="card shadow-sm mb-4 border-default">
        <div className="card-header py-3 d-flex justify-content-between align-items-center border-subtle">
          <div className="d-flex align-items-center gap-2">
            <span className="pulse-danger"></span>
            <h6 className="fw-bold mb-0 text-danger">Real-Time Incidents at Risk of SLA Breach</h6>
          </div>
          <span className="badge bg-danger text-white">
            {risks.length} Active At-Risk Incident{risks.length === 1 ? '' : 's'}
          </span>
        </div>

        <div className="card-body p-0">
          {loading ? (
            <TableSkeleton rows={4} cols={7} />
          ) : risks.length === 0 ? (
            <div className="py-5 text-center">
              <div
                className="rounded-circle d-inline-flex align-items-center justify-content-center mb-2"
                style={{ width: '56px', height: '56px', background: 'var(--success-subtle)' }}
              >
                <i className="bi bi-shield-check fs-2 text-success"></i>
              </div>
              <h6 className="fw-bold text-success mb-1">Queue Healthy & Compliant</h6>
              <p className="text-muted text-xs mb-0">All active tickets are safely within SLA target deadlines.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-custom mb-0">
                <thead>
                  <tr>
                    <th>Ticket #</th>
                    <th>Subject</th>
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
                      <td>
                        <span className="fw-bold text-primary font-monospace text-xs">
                          {r.ticket_number}
                        </span>
                      </td>
                      <td className="text-truncate" style={{ maxWidth: '240px' }}>
                        <span className="fw-medium text-primary-emphasis">{r.title}</span>
                      </td>
                      <td>
                        <PriorityBadge priority={r.priority} />
                      </td>
                      <td>
                        {r.time_remaining_minutes !== null ? (
                          r.time_remaining_minutes <= 0 ? (
                            <span className="badge bg-danger text-white">
                              <span className="pulse-danger me-1"></span>Breached
                            </span>
                          ) : (
                            <span
                              className={`fw-bold text-sm ${
                                r.time_remaining_minutes < 60 ? 'text-danger' : 'text-primary-emphasis'
                              }`}
                            >
                              {r.time_remaining_minutes >= 60
                                ? `${(r.time_remaining_minutes / 60).toFixed(1)} hrs`
                                : `${Math.round(r.time_remaining_minutes)} mins`}
                            </span>
                          )
                        ) : (
                          <span className="text-muted text-xs">N/A</span>
                        )}
                      </td>
                      <td>
                        <span
                          className={`badge ${
                            r.risk_level === 'CRITICAL'
                              ? 'bg-danger text-white'
                              : r.risk_level === 'HIGH'
                              ? 'bg-warning text-dark'
                              : 'bg-info text-white'
                          }`}
                        >
                          {Math.round(r.risk_score * 100)}% ({r.risk_level})
                        </span>
                      </td>
                      <td className="text-xs text-muted" style={{ maxWidth: '220px' }}>
                        {r.risk_factors?.join('; ') || 'Standard queue progression'}
                      </td>
                      <td className="text-xs fw-medium text-primary-emphasis" style={{ maxWidth: '240px' }}>
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
      <div className="card shadow-sm border-default">
        <div className="card-header py-3 d-flex align-items-center justify-content-between border-subtle">
          <div className="d-flex align-items-center gap-2">
            <i className="bi bi-sliders text-primary fs-5"></i>
            <h6 className="fw-bold mb-0 text-primary-emphasis">Configured Organization SLA Policies</h6>
          </div>
          <span className="badge bg-surface-subtle text-muted border border-default">
            {policies.length} Active Polic{policies.length === 1 ? 'y' : 'ies'}
          </span>
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
                  <th>Business Hours Schedule</th>
                  <th>Policy Status</th>
                </tr>
              </thead>
              <tbody>
                {policies.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center text-muted py-4 text-xs">
                      No SLA policies configured yet.
                    </td>
                  </tr>
                ) : (
                  policies.map((p) => (
                    <tr key={p.id}>
                      <td className="fw-semibold text-primary-emphasis">{p.name}</td>
                      <td>
                        <PriorityBadge priority={p.priority} />
                      </td>
                      <td className="text-sm">{p.response_time_hours} hours</td>
                      <td className="fw-semibold text-primary-emphasis text-sm">
                        {p.resolution_time_hours} hours
                      </td>
                      <td>
                        {p.business_hours_only ? (
                          <span className="badge bg-surface-subtle text-muted border border-default text-xs">
                            <i className="bi bi-clock me-1"></i>Mon-Fri (9am-6pm)
                          </span>
                        ) : (
                          <span className="badge bg-secondary-subtle text-secondary text-xs">
                            <i className="bi bi-infinity me-1"></i>24/7 Continuous
                          </span>
                        )}
                      </td>
                      <td>
                        <span className="badge bg-success-subtle text-success border border-success-subtle">
                          Active
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Policy Modal */}
      <ModernModal
        isOpen={showPolicyModal}
        onClose={() => setShowPolicyModal(false)}
        title="Configure SLA Policy"
        subtitle="Define response and resolution performance deadlines by incident priority."
        footer={
          <>
            <button
              type="button"
              className="btn btn-outline-secondary btn-sm"
              onClick={() => setShowPolicyModal(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={savingPolicy}
              onClick={handleSavePolicy}
              className="btn btn-primary btn-sm px-3"
            >
              {savingPolicy ? 'Saving...' : 'Save Policy'}
            </button>
          </>
        }
      >
        <div className="mb-3">
          <label className="form-label">Policy Name</label>
          <input
            type="text"
            required
            className="form-control"
            placeholder="e.g. Critical Enterprise Incident SLA"
            value={policyName}
            onChange={(e) => setPolicyName(e.target.value)}
          />
        </div>

        <div className="mb-3">
          <label className="form-label">Priority Level</label>
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
            <label className="form-label">Response Target (Hours)</label>
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
            <label className="form-label">Resolution Target (Hours)</label>
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
          <label htmlFor="businessCheck" className="form-check-label text-sm text-muted cursor-pointer">
            Apply business hours only (Pause timer during weekends and non-working hours)
          </label>
        </div>
      </ModernModal>
    </div>
  );
};
