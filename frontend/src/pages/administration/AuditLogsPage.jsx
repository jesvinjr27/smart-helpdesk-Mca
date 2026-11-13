import React, { useState, useEffect } from 'react';
import { getAuditLogsApi } from '../../api';

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
      <div className="mb-4">
        <h4 className="fw-bold mb-1">System Audit & Compliance Logs</h4>
        <p className="text-muted text-sm mb-0">
          Immutable event log of security actions, tenant access, role changes, and administrative operations.
        </p>
      </div>

      <div className="card shadow-sm">
        <div className="card-body p-0">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status"></div>
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-5 text-muted">
              <i className="bi bi-shield-check fs-2 text-secondary d-block mb-1"></i>
              No audit log entries recorded yet.
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-custom mb-0">
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>Actor</th>
                    <th>Action</th>
                    <th>Entity Type</th>
                    <th>IP Address</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((l) => (
                    <tr key={l.id}>
                      <td className="text-xs text-muted">
                        {new Date(l.created_at).toLocaleString()}
                      </td>
                      <td className="fw-semibold text-dark">{l.actor_name || 'System'}</td>
                      <td>
                        <span className="badge bg-light text-dark border">{l.action}</span>
                      </td>
                      <td className="text-sm">{l.entity_type}</td>
                      <td className="text-xs text-secondary">{l.ip_address || '127.0.0.1'}</td>
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
