import React, { useState, useEffect } from 'react';
import { getAuditLogsApi } from '../../api';
import { PageHeader } from '../../components/common/PageHeader';
import { EmptyState } from '../../components/common/EmptyState';
import { TableSkeleton } from '../../components/common/LoadingSkeleton';

export const AuditLogsPage = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const resp = await getAuditLogsApi({ page: 1, page_size: 50 });
        setLogs(resp.data);
      } catch (err) {
        console.error('Failed to load audit logs:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, []);

  return (
    <div>
      <PageHeader
        title="Security & System Audit Logs"
        subtitle="Immutable event log of security actions, tenant access, role changes, and administrative operations."
        badge={
          <span className="badge bg-surface-subtle text-muted border border-default">
            <i className="bi bi-shield-lock me-1"></i>Tamper-Evident
          </span>
        }
      />

      <div className="card shadow-sm border-default">
        <div className="card-header py-3 d-flex align-items-center justify-content-between border-subtle">
          <div className="d-flex align-items-center gap-2">
            <i className="bi bi-journal-text text-primary fs-5"></i>
            <h6 className="fw-bold mb-0 text-primary-emphasis">Audit Trail Events</h6>
          </div>
          <span className="badge bg-surface-subtle text-muted border border-default">
            {logs.length} Recorded Events
          </span>
        </div>

        <div className="card-body p-0">
          {loading ? (
            <TableSkeleton rows={7} cols={5} />
          ) : logs.length === 0 ? (
            <EmptyState
              icon="bi-shield-check"
              title="No audit log entries recorded"
              description="System security events and access modifications will be recorded here automatically."
            />
          ) : (
            <div className="table-responsive">
              <table className="table table-custom mb-0">
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>Actor</th>
                    <th>Action</th>
                    <th>Entity Type</th>
                    <th>Client IP</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((l) => (
                    <tr key={l.id}>
                      <td className="text-xs text-muted font-monospace">
                        {new Date(l.created_at).toLocaleString()}
                      </td>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <div
                            className="rounded-circle d-flex align-items-center justify-content-center text-white text-xs fw-bold shadow-sm"
                            style={{
                              width: '26px',
                              height: '26px',
                              background: 'var(--primary-gradient)',
                              fontSize: '0.65rem',
                            }}
                          >
                            {l.actor_name ? l.actor_name[0].toUpperCase() : 'S'}
                          </div>
                          <span className="fw-semibold text-primary-emphasis text-sm">
                            {l.actor_name || 'System Service'}
                          </span>
                        </div>
                      </td>
                      <td>
                        <span className="badge bg-surface-subtle text-primary-emphasis border border-default text-xs">
                          {l.action}
                        </span>
                      </td>
                      <td className="text-sm text-secondary font-monospace">{l.entity_type}</td>
                      <td className="text-xs text-muted font-monospace">{l.ip_address || '127.0.0.1'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
