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
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shadow-sm">
            <i className="bi bi-shield-lock text-brand-500"></i>
            <span>Tamper-Evident</span>
          </span>
        }
      />

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand-50 dark:bg-brand-950/40 text-brand-600 dark:text-brand-400 flex items-center justify-center">
              <i className="bi bi-journal-text text-lg"></i>
            </div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100 m-0">
              Audit Trail Events
            </h2>
          </div>
          <span className="inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
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
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-800/50">
                    <th className="py-3 px-4 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Timestamp
                    </th>
                    <th className="py-3 px-4 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Actor
                    </th>
                    <th className="py-3 px-4 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Action
                    </th>
                    <th className="py-3 px-4 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Entity Type
                    </th>
                    <th className="py-3 px-4 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Client IP
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {logs.map((l) => (
                    <tr
                      key={l.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-3.5 px-4 text-xs text-slate-500 dark:text-slate-400 font-mono whitespace-nowrap">
                        {new Date(l.created_at).toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[11px] font-bold bg-gradient-to-tr from-brand-600 to-indigo-600 shadow-sm flex-shrink-0">
                            {l.actor_name ? l.actor_name[0].toUpperCase() : 'S'}
                          </div>
                          <span className="font-medium text-slate-900 dark:text-slate-100 text-sm">
                            {l.actor_name || 'System Service'}
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                          {l.action}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-sm text-slate-600 dark:text-slate-400 font-mono">
                        {l.entity_type}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-500 dark:text-slate-400 font-mono">
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
