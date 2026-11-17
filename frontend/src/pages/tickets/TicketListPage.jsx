import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getTicketsApi, getCategoriesApi } from '../../api';
import { StatusBadge } from '../../components/common/StatusBadge';
import { PriorityBadge } from '../../components/common/PriorityBadge';
import { PageHeader } from '../../components/common/PageHeader';
import { EmptyState } from '../../components/common/EmptyState';
import { TableSkeleton } from '../../components/common/LoadingSkeleton';

export const TicketListPage = () => {
  const navigate = useNavigate();

  const [tickets, setTickets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter and pagination state
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');

  // Quick view tab
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const resp = await getCategoriesApi();
        setCategories(resp.data);
      } catch (err) {
        console.error('Failed to load categories:', err);
      }
    };
    fetchCategories();
  }, []);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const resp = await getTicketsApi({
        page,
        page_size: 10,
        status: statusFilter || undefined,
        priority: priorityFilter || undefined,
        category_id: categoryFilter || undefined,
        search: searchQuery || undefined,
        sort_by: sortBy,
        sort_order: sortOrder,
      });
      setTickets(resp.data.items || []);
      setTotalPages(resp.data.total_pages || 1);
    } catch (err) {
      console.error('Failed to fetch tickets:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [page, statusFilter, priorityFilter, categoryFilter, sortBy, sortOrder]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchTickets();
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setPage(1);
    if (tab === 'all') {
      setStatusFilter('');
      setPriorityFilter('');
    } else if (tab === 'open') {
      setStatusFilter('IN_PROGRESS');
      setPriorityFilter('');
    } else if (tab === 'critical') {
      setStatusFilter('');
      setPriorityFilter('CRITICAL');
    } else if (tab === 'resolved') {
      setStatusFilter('RESOLVED');
      setPriorityFilter('');
    }
  };

  const clearAllFilters = () => {
    setStatusFilter('');
    setPriorityFilter('');
    setCategoryFilter('');
    setSearchQuery('');
    setSortBy('created_at');
    setSortOrder('desc');
    setActiveTab('all');
    setPage(1);
  };

  const isFiltered = Boolean(
    statusFilter || priorityFilter || categoryFilter || searchQuery || activeTab !== 'all'
  );

  return (
    <div className="space-y-5">
      <PageHeader
        title="Incident & Support Tickets"
        subtitle="Manage tickets, inspect SLA risks, and assign inquiries across department queues."
        actions={
          <button
            onClick={() => navigate('/tickets/new')}
            className="px-4 py-2 bg-brand-primary hover:bg-brand-primary/90 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-subtle transition-all inline-flex items-center gap-1.5"
          >
            <i className="bi bi-plus-lg" />
            <span>Create Ticket</span>
          </button>
        }
      />

      {/* Quick View Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-brand-primary/15 pb-3 overflow-x-auto">
        <button
          type="button"
          onClick={() => handleTabChange('all')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap ${
            activeTab === 'all'
              ? 'bg-brand-primary text-white shadow-subtle'
              : 'bg-brand-secondary/15 text-brand-primary hover:bg-brand-secondary/25'
          }`}
        >
          All Tickets
        </button>
        <button
          type="button"
          onClick={() => handleTabChange('open')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap ${
            activeTab === 'open'
              ? 'bg-brand-primary text-white shadow-subtle'
              : 'bg-brand-secondary/15 text-brand-primary hover:bg-brand-secondary/25'
          }`}
        >
          In Progress
        </button>
        <button
          type="button"
          onClick={() => handleTabChange('critical')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap inline-flex items-center gap-1.5 ${
            activeTab === 'critical'
              ? 'bg-brand-primary text-white shadow-subtle'
              : 'bg-brand-primary/10 text-brand-primary hover:bg-brand-primary/20 border border-brand-primary/25'
          }`}
        >
          <i className="bi bi-exclamation-octagon-fill text-brand-accent" />
          <span>Critical Incidents</span>
        </button>
        <button
          type="button"
          onClick={() => handleTabChange('resolved')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap ${
            activeTab === 'resolved'
              ? 'bg-brand-primary text-white shadow-subtle'
              : 'bg-brand-secondary/15 text-brand-primary hover:bg-brand-secondary/25'
          }`}
        >
          Resolved
        </button>

        {isFiltered && (
          <button
            type="button"
            onClick={clearAllFilters}
            className="text-xs text-brand-secondary hover:text-brand-primary ml-auto whitespace-nowrap inline-flex items-center gap-1"
          >
            <i className="bi bi-x-circle" />
            <span>Clear all filters</span>
          </button>
        )}
      </div>

      {/* Filter and Search Bar Card */}
      <div className="bg-app-background border border-brand-primary/15 rounded-xl p-3.5 shadow-subtle">
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-center">
          {/* Search Input */}
          <div className="lg:col-span-4">
            <div className="relative flex items-center">
              <span className="absolute left-3 text-brand-secondary text-sm pointer-events-none">
                <i className="bi bi-search" />
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search subject, description, ticket #..."
                className="w-full pl-9 pr-3.5 py-2 text-xs sm:text-sm bg-app-background border border-brand-secondary/40 rounded-xl text-brand-primary placeholder:text-brand-secondary/60 focus:outline-none focus:ring-2 focus:ring-brand-accent/40 focus:border-brand-primary transition-colors"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div className="lg:col-span-2">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setActiveTab('custom');
                setPage(1);
              }}
              className="w-full px-3 py-2 text-xs sm:text-sm bg-app-background border border-brand-secondary/40 rounded-xl text-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-accent/40 focus:border-brand-primary transition-colors cursor-pointer"
            >
              <option value="">All Statuses</option>
              <option value="NEW">New</option>
              <option value="ASSIGNED">Assigned</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="PENDING_CUSTOMER">Pending Customer</option>
              <option value="RESOLVED">Resolved</option>
              <option value="CLOSED">Closed</option>
              <option value="REOPENED">Reopened</option>
            </select>
          </div>

          {/* Priority Filter */}
          <div className="lg:col-span-2">
            <select
              value={priorityFilter}
              onChange={(e) => {
                setPriorityFilter(e.target.value);
                setActiveTab('custom');
                setPage(1);
              }}
              className="w-full px-3 py-2 text-xs sm:text-sm bg-app-background border border-brand-secondary/40 rounded-xl text-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-accent/40 focus:border-brand-primary transition-colors cursor-pointer"
            >
              <option value="">All Priorities</option>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>

          {/* Category Filter */}
          <div className="lg:col-span-2">
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 text-xs sm:text-sm bg-app-background border border-brand-secondary/40 rounded-xl text-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-accent/40 focus:border-brand-primary transition-colors cursor-pointer"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Sort Order */}
          <div className="lg:col-span-2">
            <select
              value={`${sortBy}:${sortOrder}`}
              onChange={(e) => {
                const [col, ord] = e.target.value.split(':');
                setSortBy(col);
                setSortOrder(ord);
                setPage(1);
              }}
              className="w-full px-3 py-2 text-xs sm:text-sm bg-app-background border border-brand-secondary/40 rounded-xl text-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-accent/40 focus:border-brand-primary transition-colors cursor-pointer"
            >
              <option value="created_at:desc">Newest First</option>
              <option value="created_at:asc">Oldest First</option>
              <option value="priority:asc">Priority High-Low</option>
            </select>
          </div>
        </form>
      </div>

      {/* Tickets Table Card */}
      <div className="bg-app-background border border-brand-primary/15 rounded-xl shadow-subtle overflow-hidden flex flex-col">
        <div className="flex-1 overflow-x-auto">
          {loading ? (
            <TableSkeleton rows={7} cols={8} />
          ) : tickets.length === 0 ? (
            <EmptyState
              icon="bi-ticket-detailed"
              title="No tickets found"
              description="No tickets currently match the selected search terms or filters. Try adjusting your query or create a new ticket."
              action={
                <button
                  onClick={() => navigate('/tickets/new')}
                  className="px-4 py-2 bg-brand-primary hover:bg-brand-primary/90 text-white font-medium text-xs sm:text-sm rounded-xl shadow-subtle transition-all inline-flex items-center gap-1.5"
                >
                  <i className="bi bi-plus-lg" />
                  <span>Create Ticket</span>
                </button>
              }
            />
          ) : (
            <table className="w-full text-left border-collapse min-w-[760px]">
              <thead className="bg-brand-secondary/15 border-b border-brand-primary/15 text-[11px] font-semibold uppercase tracking-wider text-brand-primary">
                <tr>
                  <th className="px-4 py-3.5">Ticket #</th>
                  <th className="px-4 py-3.5">Subject & Summary</th>
                  <th className="px-4 py-3.5">Category</th>
                  <th className="px-4 py-3.5">Priority</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5">Requester</th>
                  <th className="px-4 py-3.5">Assignee</th>
                  <th className="px-4 py-3.5">SLA Deadlines</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-primary/10 text-sm">
                {tickets.map((t) => (
                  <tr
                    key={t.id}
                    onClick={() => navigate(`/tickets/${t.id}`)}
                    className="hover:bg-brand-accent/15 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3.5">
                      <span className="font-mono font-bold text-xs text-brand-primary">
                        {t.ticket_number}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="font-semibold text-brand-primary max-w-[280px] truncate">
                        {t.title}
                      </div>
                      <div className="text-xs text-brand-secondary mt-0.5">
                        {new Date(t.created_at).toLocaleString()}
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-medium bg-brand-secondary/15 text-brand-primary border border-brand-secondary/30">
                        {t.category_name || 'General'}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <PriorityBadge priority={t.priority} />
                    </td>
                    <td className="px-4 py-3.5">
                      <StatusBadge status={t.status} />
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-xs sm:text-sm text-brand-primary">
                        {t.requester_name || 'Requester'}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      {t.assignee_name ? (
                        <div className="flex items-center gap-1.5">
                          <div className="w-6 h-6 rounded-lg bg-brand-primary flex items-center justify-center text-white text-[10px] font-bold shadow-xs flex-shrink-0">
                            {t.assignee_name[0].toUpperCase()}
                          </div>
                          <span className="text-xs sm:text-sm font-medium text-brand-primary truncate max-w-[120px]">
                            {t.assignee_name}
                          </span>
                        </div>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-brand-secondary/15 text-brand-secondary">
                          Unassigned
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      {t.is_sla_breached ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-brand-primary text-white border border-brand-primary shadow-xs">
                          <i className="bi bi-exclamation-triangle-fill text-brand-accent text-xs" />
                          <span>Breached</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-brand-secondary/20 text-brand-primary border border-brand-secondary/40">
                          <i className="bi bi-check-circle text-xs" />
                          <span>Within SLA</span>
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Modern Pagination Footer */}
        {totalPages > 1 && (
          <div className="px-5 py-3.5 border-t border-brand-primary/15 bg-app-background flex flex-wrap items-center justify-between gap-3 text-xs">
            <span className="text-brand-secondary">
              Showing page <b className="text-brand-primary">{page}</b> of{' '}
              <b className="text-brand-primary">{totalPages}</b>
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="px-3 py-1.5 rounded-lg border border-brand-primary/20 bg-app-background text-brand-primary hover:bg-brand-secondary/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors inline-flex items-center gap-1"
              >
                <i className="bi bi-chevron-left" />
                <span>Previous</span>
              </button>
              <span className="px-2 font-semibold text-brand-primary">{page}</span>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
                className="px-3 py-1.5 rounded-lg border border-brand-primary/20 bg-app-background text-brand-primary hover:bg-brand-secondary/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors inline-flex items-center gap-1"
              >
                <span>Next</span>
                <i className="bi bi-chevron-right" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
