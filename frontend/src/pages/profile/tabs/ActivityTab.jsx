import React, { useState, useEffect } from 'react';
import { getMyActivityApi } from '../../../api';
import { Link } from 'react-router-dom';

export const ActivityTab = () => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterType, setFilterType] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchActivity();
  }, []);

  const fetchActivity = async () => {
    setLoading(true);
    try {
      const res = await getMyActivityApi({ limit: 50 });
      setActivities(res.data || []);
    } catch (err) {
      // Empty state
    } finally {
      setLoading(false);
    }
  };

  const getActionIcon = (action) => {
    const act = (action || '').toUpperCase();
    if (act.includes('LOGIN') || act.includes('SESSION')) return 'bi-box-arrow-in-right text-blue-600';
    if (act.includes('PASSWORD')) return 'bi-key-fill text-amber-600';
    if (act.includes('PROFILE') || act.includes('AVATAR')) return 'bi-person-badge-fill text-indigo-600';
    if (act.includes('TICKET_CREATED') || act.includes('CREATE')) return 'bi-plus-circle-fill text-emerald-600';
    if (act.includes('COMMENT')) return 'bi-chat-left-text-fill text-teal-600';
    if (act.includes('RESOLV')) return 'bi-check-circle-fill text-emerald-700';
    if (act.includes('STATUS')) return 'bi-arrow-left-right text-purple-600';
    return 'bi-clock-history text-brand-secondary';
  };

  const filtered = activities.filter((item) => {
    const matchesSearch =
      searchTerm === '' ||
      item.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.entity_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.entity_id && item.entity_id.toLowerCase().includes(searchTerm.toLowerCase()));

    if (!matchesSearch) return false;
    if (filterType === 'ALL') return true;
    if (filterType === 'AUTH') return item.action.includes('LOG') || item.action.includes('PASSWORD') || item.action.includes('SESSION');
    if (filterType === 'PROFILE') return item.action.includes('PROFILE') || item.action.includes('AVATAR') || item.action.includes('PREFERENCE');
    if (filterType === 'TICKET') return item.action.includes('TICKET') || item.entity_type === 'Ticket';
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="card-glow rounded-2xl p-5 sm:p-6 bg-white/70 border border-brand-primary/10 space-y-5">
        {/* Header & Controls */}
        <div className="border-b border-brand-primary/10 pb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-base text-brand-primary flex items-center gap-2">
              <i className="bi bi-clock-history text-brand-secondary" />
              <span>Personal Activity Timeline</span>
            </h3>
            <p className="text-xs text-brand-secondary mt-0.5">
              Chronological log of your authenticated actions, tickets, and profile modifications.
            </p>
          </div>

          <button
            type="button"
            onClick={fetchActivity}
            className="px-3 py-1.5 text-xs text-brand-secondary hover:text-brand-primary hover:bg-brand-secondary/15 rounded-lg transition-colors flex items-center gap-1.5"
          >
            <i className={`bi bi-arrow-clockwise ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-brand-secondary/5 p-3 rounded-xl border border-brand-primary/10">
          <div className="relative w-full sm:w-72">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search action or entity..."
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-brand-primary/20 bg-white text-brand-primary focus:outline-none focus:border-brand-primary"
            />
            <i className="bi bi-search absolute left-2.5 top-2 text-brand-secondary text-xs" />
          </div>

          <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
            {['ALL', 'AUTH', 'PROFILE', 'TICKET'].map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilterType(f)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                  filterType === f
                    ? 'bg-brand-primary text-white shadow-xs'
                    : 'text-brand-secondary hover:text-brand-primary hover:bg-brand-secondary/15'
                }`}
              >
                {f === 'ALL' && 'All Activity'}
                {f === 'AUTH' && 'Security & Auth'}
                {f === 'PROFILE' && 'Profile Changes'}
                {f === 'TICKET' && 'Ticket Actions'}
              </button>
            ))}
          </div>
        </div>

        {/* Activity Stream */}
        {loading ? (
          <div className="py-12 text-center text-xs text-brand-secondary space-y-2">
            <i className="bi bi-arrow-repeat animate-spin text-2xl text-brand-primary block" />
            <span>Loading activity timeline...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center text-xs text-brand-secondary space-y-2">
            <i className="bi bi-inbox text-3xl text-brand-secondary/60 block" />
            <span className="font-semibold text-brand-primary block">No Activity Found</span>
            <span>Actions performed by your user account will appear here automatically.</span>
          </div>
        ) : (
          <div className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-brand-primary/15">
            {filtered.map((item, idx) => (
              <div key={item.id || idx} className="relative group">
                {/* Dot */}
                <div className="absolute -left-6 sm:-left-8 top-1 w-6 h-6 rounded-full bg-white border-2 border-brand-primary/30 flex items-center justify-center text-xs shadow-xs group-hover:scale-110 transition-transform">
                  <i className={`bi ${getActionIcon(item.action)} text-xs`} />
                </div>

                {/* Content Card */}
                <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-brand-primary/15 hover:border-brand-primary/40 transition-all shadow-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1">
                    <span className="font-bold text-xs text-brand-primary">
                      {item.action.replace(/_/g, ' ')}
                    </span>
                    <span className="text-[11px] text-brand-secondary font-mono">
                      {new Date(item.created_at).toLocaleString()}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-[11px] text-brand-secondary mt-1">
                    <span className="px-2 py-0.5 rounded bg-brand-secondary/15 text-brand-primary font-medium">
                      Entity: {item.entity_type}
                    </span>

                    {item.entity_id && item.entity_type === 'Ticket' ? (
                      <Link
                        to={`/tickets/${item.entity_id}`}
                        className="text-brand-primary font-semibold hover:underline flex items-center gap-1"
                      >
                        <span>View Ticket</span>
                        <i className="bi bi-box-arrow-up-right text-[10px]" />
                      </Link>
                    ) : item.entity_id ? (
                      <span className="font-mono text-[10px] text-brand-secondary">
                        ID: {item.entity_id.slice(0, 8)}...
                      </span>
                    ) : null}

                    {item.ip_address && (
                      <span>• IP: {item.ip_address}</span>
                    )}
                  </div>

                  {item.details && typeof item.details === 'object' && (
                    <div className="mt-2 pt-2 border-t border-brand-primary/10 text-[11px] text-brand-primary/80">
                      {item.details.message && <span>{item.details.message}</span>}
                      {item.details.updated_fields && (
                        <span>Updated fields: {item.details.updated_fields.join(', ')}</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
