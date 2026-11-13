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

  const isFiltered = Boolean(statusFilter || priorityFilter || categoryFilter || searchQuery);

  return (
    <div>
      <PageHeader
        title="Incident & Request Queue"
        subtitle="Track, assign, prioritize, and resolve enterprise helpdesk incidents with AI intelligence."
        actions={
          <button
            onClick={() => navigate('/tickets/new')}
            className="btn btn-primary btn-sm rounded-3 px-3 shadow-sm"
          >
            <i className="bi bi-plus-lg me-1"></i>New Ticket
          </button>
        }
      />

      {/* Quick View Filter Tabs */}
      <div className="d-flex align-items-center gap-2 mb-3 border-bottom border-subtle pb-2 overflow-x-auto">
        <button
          type="button"
          onClick={() => handleTabChange('all')}
          className={`btn btn-sm border-0 py-1.5 px-3 rounded-pill text-xs fw-semibold ${
            activeTab === 'all'
              ? 'btn-primary shadow-sm'
              : 'text-secondary bg-surface-subtle'
          }`}
        >
          All Tickets
        </button>
        <button
          type="button"
          onClick={() => handleTabChange('open')}
          className={`btn btn-sm border-0 py-1.5 px-3 rounded-pill text-xs fw-semibold ${
            activeTab === 'open'
              ? 'btn-primary shadow-sm'
              : 'text-secondary bg-surface-subtle'
          }`}
        >
          In Progress
        </button>
        <button
          type="button"
          onClick={() => handleTabChange('critical')}
          className={`btn btn-sm border-0 py-1.5 px-3 rounded-pill text-xs fw-semibold ${
            activeTab === 'critical'
              ? 'btn-danger shadow-sm'
              : 'text-danger bg-danger-subtle'
          }`}
        >
          <i className="bi bi-exclamation-octagon-fill me-1"></i>Critical Incidents
        </button>
        <button
          type="button"
          onClick={() => handleTabChange('resolved')}
          className={`btn btn-sm border-0 py-1.5 px-3 rounded-pill text-xs fw-semibold ${
            activeTab === 'resolved'
              ? 'btn-success shadow-sm'
              : 'text-secondary bg-surface-subtle'
          }`}
        >
          Resolved
        </button>

        {isFiltered && (
          <button
            type="button"
            onClick={clearAllFilters}
            className="btn btn-sm btn-link text-decoration-none text-muted text-xs ms-auto"
          >
            <i className="bi bi-x-circle me-1"></i>Clear all filters
          </button>
        )}
      </div>

      {/* Filter and Search Bar Card */}
      <div className="card shadow-sm mb-4">
        <div className="card-body p-3">
          <form onSubmit={handleSearchSubmit} className="row g-2.5 align-items-center">
            {/* Search Input */}
            <div className="col-md-4">
              <div className="input-group">
                <span className="input-group-text bg-surface-subtle border-default border-end-0 text-muted">
                  <i className="bi bi-search"></i>
                </span>
                <input
                  type="text"
                  className="form-control border-start-0"
                  placeholder="Search subject, description, ticket #..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {/* Status Filter */}
            <div className="col-sm-6 col-md-2">
              <select
                className="form-select"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setActiveTab('custom');
                  setPage(1);
                }}
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
            <div className="col-sm-6 col-md-2">
              <select
                className="form-select"
                value={priorityFilter}
                onChange={(e) => {
                  setPriorityFilter(e.target.value);
                  setActiveTab('custom');
                  setPage(1);
                }}
              >
                <option value="">All Priorities</option>
                <option value="CRITICAL">Critical</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>
            </div>

            {/* Category Filter */}
            <div className="col-sm-6 col-md-2">
              <select
                className="form-select"
                value={categoryFilter}
                onChange={(e) => {
                  setCategoryFilter(e.target.value);
                  setPage(1);
                }}
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
            <div className="col-sm-6 col-md-2">
              <select
                className="form-select"
                value={`${sortBy}:${sortOrder}`}
                onChange={(e) => {
                  const [col, ord] = e.target.value.split(':');
                  setSortBy(col);
                  setSortOrder(ord);
                  setPage(1);
                }}
              >
                <option value="created_at:desc">Newest First</option>
                <option value="created_at:asc">Oldest First</option>
                <option value="priority:asc">Priority High-Low</option>
              </select>
            </div>
          </form>
        </div>
      </div>

      {/* Tickets Table Card */}
      <div className="card shadow-sm">
        <div className="card-body p-0">
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
                  className="btn btn-primary btn-sm rounded-3 shadow-sm px-3"
                >
                  <i className="bi bi-plus-lg me-1"></i>Create Ticket
                </button>
              }
            />
          ) : (
            <div className="table-responsive">
              <table className="table table-custom mb-0">
                <thead>
                  <tr>
                    <th>Ticket #</th>
                    <th>Subject & Summary</th>
                    <th>Category</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th>Requester</th>
                    <th>Assignee</th>
                    <th>SLA Deadlines</th>
                  </tr>
                </thead>
                <tbody>
                  {tickets.map((t) => (
                    <tr
                      key={t.id}
                      className="cursor-pointer"
                      onClick={() => navigate(`/tickets/${t.id}`)}
                    >
                      <td>
                        <span className="fw-bold text-primary font-monospace text-xs">
                          {t.ticket_number}
                        </span>
                      </td>
                      <td>
                        <div
                          className="fw-semibold text-primary-emphasis text-truncate"
                          style={{ maxWidth: '300px' }}
                        >
                          {t.title}
                        </div>
                        <div className="text-xs text-muted">
                          {new Date(t.created_at).toLocaleString()}
                        </div>
                      </td>
                      <td>
                        <span className="badge bg-surface-subtle text-primary-emphasis border border-default text-xs">
                          {t.category_name || 'General'}
                        </span>
                      </td>
                      <td>
                        <PriorityBadge priority={t.priority} />
                      </td>
                      <td>
                        <StatusBadge status={t.status} />
                      </td>
                      <td>
                        <span className="text-sm text-primary-emphasis">
                          {t.requester_name || 'Requester'}
                        </span>
                      </td>
                      <td>
                        {t.assignee_name ? (
                          <div className="d-flex align-items-center gap-1.5">
                            <div
                              className="rounded-circle d-flex align-items-center justify-content-center text-white text-xs fw-bold"
                              style={{
                                width: '22px',
                                height: '22px',
                                background: 'var(--primary-gradient)',
                                fontSize: '0.65rem',
                              }}
                            >
                              {t.assignee_name[0].toUpperCase()}
                            </div>
                            <span className="text-sm fw-medium text-primary-emphasis">
                              {t.assignee_name}
                            </span>
                          </div>
                        ) : (
                          <span className="badge bg-secondary-subtle text-muted text-xs">
                            Unassigned
                          </span>
                        )}
                      </td>
                      <td>
                        {t.is_sla_breached ? (
                          <span className="badge bg-danger-subtle text-danger border border-danger-subtle d-inline-flex align-items-center gap-1.5">
                            <span className="pulse-danger"></span>
                            <span>Breached</span>
                          </span>
                        ) : (
                          <span className="badge bg-success-subtle text-success border border-success-subtle">
                            <i className="bi bi-check-circle me-1"></i>Within SLA
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modern Pagination Footer */}
        {totalPages > 1 && (
          <div className="card-footer d-flex flex-wrap justify-content-between align-items-center gap-2 py-3">
            <span className="text-xs text-muted">
              Showing page <b>{page}</b> of <b>{totalPages}</b>
            </span>
            <div className="d-flex align-items-center gap-1">
              <button
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="btn btn-outline-secondary btn-sm rounded-2 py-1 px-2.5 text-xs"
              >
                <i className="bi bi-chevron-left me-1"></i>Previous
              </button>
              <span className="px-2 text-xs fw-semibold text-primary">{page}</span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
                className="btn btn-outline-secondary btn-sm rounded-2 py-1 px-2.5 text-xs"
              >
                Next<i className="bi bi-chevron-right ms-1"></i>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
