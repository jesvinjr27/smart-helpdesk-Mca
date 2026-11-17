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
    <div className="space-y-6">
      <PageHeader
        title="Security & System Audit Logs"
        subtitle="Immutable event log of security actions, tenant access, role changes, and administrative operations."
        badge={
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-brand-secondary/20 text-brand-primary border border-brand-secondary/40 shadow-subtle">
            <i className="bi bi-shield-lock text-brand-primary"></i>
            <span>Tamper-Evident</span>
          </span>
        }
      />

      <div className="bg-app-background border border-brand-primary/15 rounded-2xl shadow-subtle overflow-hidden">
        <div className="px-5 py-4 border-b border-brand-primary/10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-brand-secondary/20 text-brand-primary flex items-center justify-center">
              <i className="bi bi-journal-text text-lg"></i>
            </div>
            <h2 className="text-base font-semibold text-brand-primary m-0">
              Audit Trail Events
            </h2>
          </div>
          <span className="inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full bg-brand-secondary/15 text-brand-primary border border-brand-secondary/30">
            {logs.length} Recorded Events
          </span>
        </div>

        <div className="p-0">
          {loading ? (
            <div className="p-4">
              <TableSkeleton rows={7} cols={5} />
            </div>
          ) : logs.length === 0 ? (
            <div className="py-12">
              <EmptyState
                icon="bi-shield-check"
                title="No audit log entries recorded"
                description="System security events and access modifications will be recorded here automatically."
              />
            </div>
          ) : (
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                  <tr className="border-b border-brand-primary/10 bg-brand-secondary/15">
                    <th className="py-3 px-4 text-xs font-semibold uppercase tracking-wider text-brand-primary">
                      Timestamp
                    </th>
                    <th className="py-3 px-4 text-xs font-semibold uppercase tracking-wider text-brand-primary">
                      Actor
                    </th>
                    <th className="py-3 px-4 text-xs font-semibold uppercase tracking-wider text-brand-primary">
                      Action
                    </th>
                    <th className="py-3 px-4 text-xs font-semibold uppercase tracking-wider text-brand-primary">
                      Entity Type
                    </th>
                    <th className="py-3 px-4 text-xs font-semibold uppercase tracking-wider text-brand-primary">
                      Client IP
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-primary/10">
                  {logs.map((l) => (
                    <tr
                      key={l.id}
                      className="hover:bg-brand-accent/15 transition-colors"
                    >
                      <td className="py-3.5 px-4 text-xs text-brand-secondary font-mono whitespace-nowrap">
                        {new Date(l.created_at).toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[11px] font-bold bg-brand-primary shadow-subtle flex-shrink-0">
                            {l.actor_name ? l.actor_name[0].toUpperCase() : 'S'}
                          </div>
                          <span className="font-medium text-brand-primary text-sm">
                            {l.actor_name || 'System Service'}
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-brand-secondary/15 text-brand-primary border border-brand-secondary/30">
                          {l.action}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-sm text-brand-primary font-mono">
                        {l.entity_type}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-brand-secondary font-mono">
                        {l.ip_address || '127.0.0.1'}
                      </td>
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
