import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { getSLARisksApi, getSLAPoliciesApi, createSLAPolicyApi } from '../../api';
import { PriorityBadge } from '../../components/common/PriorityBadge';
import { PageHeader } from '../../components/common/PageHeader';
import { ModernModal } from '../../components/common/ModernModal';
import { TableSkeleton } from '../../components/common/LoadingSkeleton';

export const SLAManagementPage = () => {
  const { hasRole } = useAuth();
  const navigate = useNavigate();

  const [risks, setRisks] = useState([]);
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);

  // Policy Modal
  const [showPolicyModal, setShowPolicyModal] = useState(false);
  const [policyName, setPolicyName] = useState('');
  const [priority, setPriority] = useState('HIGH');
  const [respHours, setRespHours] = useState(2);
  const [resolHours, setResolHours] = useState(8);
  const [businessOnly, setBusinessOnly] = useState(true);
  const [savingPolicy, setSavingPolicy] = useState(false);

  const canManagePolicies = hasRole(['ORG_ADMIN', 'SYS_ADMIN', 'LEAD']);

  const loadData = async () => {
    setLoading(true);
    try {
      const [rResp, pResp] = await Promise.all([getSLARisksApi(), getSLAPoliciesApi()]);
      setRisks(rResp.data || []);
      setPolicies(pResp.data || []);
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
        priority: priority,
        response_time_hours: parseFloat(respHours),
        resolution_time_hours: parseFloat(resolHours),
        business_hours_only: businessOnly,
      });
      setShowPolicyModal(false);
      setPolicyName('');
      await loadData();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to create SLA policy');
    } finally {
      setSavingPolicy(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="SLA Risk & Compliance Monitoring"
        subtitle="Predictive early-warning alerts for queue congestion, turnaround times, and policy targets."
        actions={
          canManagePolicies && (
            <button
              onClick={() => setShowPolicyModal(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-xs transition-colors inline-flex items-center gap-1.5"
            >
              <i className="bi bi-plus-lg" />
              <span>Configure SLA Policy</span>
            </button>
          )
        }
      />

      {/* At-Risk Live Monitor Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden flex flex-col">
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500" />
            </span>
            <h3 className="font-bold text-sm text-rose-600 dark:text-rose-400">
              Real-Time Incidents at Risk of SLA Breach
            </h3>
          </div>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200 dark:border-rose-800/60">
            {risks.length} Active At-Risk Incident{risks.length === 1 ? '' : 's'}
          </span>
        </div>

        <div className="flex-1 overflow-x-auto">
          {loading ? (
            <TableSkeleton rows={4} cols={7} />
          ) : risks.length === 0 ? (
            <div className="py-12 text-center">
              <div className="w-12 h-12 mx-auto rounded-full bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400 text-2xl mb-2">
                <i className="bi bi-shield-check" />
              </div>
              <h4 className="font-bold text-sm text-emerald-700 dark:text-emerald-400 mb-1">
                Queue Healthy & Compliant
              </h4>
              <p className="text-xs text-slate-400 mb-0">
                All active tickets are safely within SLA target deadlines.
              </p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse min-w-[760px]">
              <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <tr>
                  <th className="px-4 py-3.5">Ticket #</th>
                  <th className="px-4 py-3.5">Subject</th>
                  <th className="px-4 py-3.5">Priority</th>
                  <th className="px-4 py-3.5">Time Remaining</th>
                  <th className="px-4 py-3.5">Risk Score</th>
                  <th className="px-4 py-3.5">Key Operational Factors</th>
                  <th className="px-4 py-3.5">Suggested Mitigation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-sm">
                {risks.map((r) => (
                  <tr
                    key={r.ticket_id}
                    onClick={() => navigate(`/tickets/${r.ticket_id}`)}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3.5">
                      <span className="font-mono font-bold text-xs text-blue-600 dark:text-blue-400">
                        {r.ticket_number}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 max-w-[240px] truncate font-medium text-slate-900 dark:text-slate-100">
                      {r.title}
                    </td>
                    <td className="px-4 py-3.5">
                      <PriorityBadge priority={r.priority} />
                    </td>
                    <td className="px-4 py-3.5">
                      {r.time_remaining_minutes !== null ? (
                        r.time_remaining_minutes <= 0 ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200 dark:border-rose-800/60">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
                            <span>Breached</span>
                          </span>
                        ) : (
                          <span
                            className={`font-bold text-xs sm:text-sm ${
                              r.time_remaining_minutes < 60
                                ? 'text-rose-600 dark:text-rose-400'
                                : 'text-slate-800 dark:text-slate-200'
                            }`}
                          >
                            {r.time_remaining_minutes >= 60
                              ? `${(r.time_remaining_minutes / 60).toFixed(1)} hrs`
                              : `${Math.round(r.time_remaining_minutes)} mins`}
                          </span>
                        )
                      ) : (
                        <span className="text-slate-400 text-xs">N/A</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          r.risk_level === 'CRITICAL'
                            ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400'
                            : r.risk_level === 'HIGH'
                            ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400'
                            : 'bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-400'
                        }`}
                      >
                        {Math.round(r.risk_score * 100)}% ({r.risk_level})
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-xs text-slate-500 dark:text-slate-400 max-w-[220px] truncate">
                      {r.risk_factors?.join('; ') || 'Standard queue progression'}
                    </td>
                    <td className="px-4 py-3.5 text-xs font-medium text-slate-800 dark:text-slate-200 max-w-[240px] truncate">
                      {r.suggested_mitigation || 'Maintain standard pacing'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* SLA Policies Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden flex flex-col">
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <i className="bi bi-sliders text-blue-600 text-lg" />
            <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
              Configured Organization SLA Policies
            </h3>
          </div>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
            {policies.length} Active Polic{policies.length === 1 ? 'y' : 'ies'}
          </span>
        </div>

        <div className="flex-1 overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[720px]">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              <tr>
                <th className="px-4 py-3.5">Policy Name</th>
                <th className="px-4 py-3.5">Priority Level</th>
                <th className="px-4 py-3.5">First Response Target</th>
                <th className="px-4 py-3.5">Resolution Target</th>
                <th className="px-4 py-3.5">Business Hours Schedule</th>
                <th className="px-4 py-3.5">Policy Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-sm">
              {policies.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center text-slate-400 py-6 text-xs">
                    No SLA policies configured yet.
                  </td>
                </tr>
              ) : (
                policies.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-4 py-3.5 font-semibold text-slate-900 dark:text-slate-100">
                      {p.name}
                    </td>
                    <td className="px-4 py-3.5">
                      <PriorityBadge priority={p.priority} />
                    </td>
                    <td className="px-4 py-3.5 text-slate-600 dark:text-slate-300">
                      {p.response_time_hours} hours
                    </td>
                    <td className="px-4 py-3.5 font-semibold text-slate-900 dark:text-slate-100">
                      {p.resolution_time_hours} hours
                    </td>
                    <td className="px-4 py-3.5">
                      {p.business_hours_only ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                          <i className="bi bi-clock text-xs" />
                          <span>Mon-Fri (9am-6pm)</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-500">
                          <i className="bi bi-infinity text-xs" />
                          <span>24/7 Continuous</span>
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60">
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
              className="px-4 py-2 text-xs sm:text-sm font-medium rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              onClick={() => setShowPolicyModal(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={savingPolicy}
              onClick={handleSavePolicy}
              className="px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-colors disabled:opacity-50"
            >
              {savingPolicy ? 'Saving...' : 'Save Policy'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
              Policy Name
            </label>
            <input
              type="text"
              required
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
              placeholder="e.g. Critical Enterprise Incident SLA"
              value={policyName}
              onChange={(e) => setPolicyName(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
              Priority Level
            </label>
            <select
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors cursor-pointer"
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
            >
              <option value="CRITICAL">CRITICAL</option>
              <option value="HIGH">HIGH</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="LOW">LOW</option>
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                Response Target (Hours)
              </label>
              <input
                type="number"
                step="0.5"
                required
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                value={respHours}
                onChange={(e) => setRespHours(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                Resolution Target (Hours)
              </label>
              <input
                type="number"
                step="0.5"
                required
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                value={resolHours}
                onChange={(e) => setResolHours(e.target.value)}
              />
            </div>
          </div>

          <label className="inline-flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 cursor-pointer select-none pt-1">
            <input
              type="checkbox"
              checked={businessOnly}
              onChange={(e) => setBusinessOnly(e.target.checked)}
              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500/20"
            />
            <span>Apply business hours only (Pause timer during weekends and non-working hours)</span>
          </label>
        </div>
      </ModernModal>
    </div>
  );
};
