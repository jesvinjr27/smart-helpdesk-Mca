import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getTicketsApi, getCategoriesApi } from '../../api';

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

  return (
    <div>
      {/* Page Header */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-2">
        <div>
          <h4 className="fw-bold mb-1">Ticket Management</h4>
          <p className="text-muted text-sm mb-0">
            View, filter, and respond to incoming help requests and incidents.
          </p>
        </div>
        <button
          onClick={() => navigate('/tickets/new')}
          className="btn btn-primary d-flex align-items-center gap-2 rounded-3 px-3 shadow-sm"
        >
          <i className="bi bi-plus-lg"></i>
          <span>Create Ticket</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="card shadow-sm mb-4">
        <div className="card-body p-3">
          <form onSubmit={handleSearchSubmit} className="row g-2 align-items-center">
            {/* Search Input */}
            <div className="col-md-4">
              <div className="input-group">
                <span className="input-group-text bg-light border-end-0">
                  <i className="bi bi-search text-muted"></i>
                </span>
                <input
                  type="text"
                  className="form-control border-start-0"
                  placeholder="Search title, description, ticket #..."
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

      {/* Tickets Table */}
      <div className="card shadow-sm">
        <div className="card-body p-0">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status"></div>
            </div>
          ) : tickets.length === 0 ? (
            <div className="text-center py-5 text-muted">
              <i className="bi bi-ticket-detailed fs-1 text-secondary d-block mb-2"></i>
              No tickets found matching the selected filters.
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-custom table-hover mb-0">
                <thead>
                  <tr>
                    <th>Ticket #</th>
                    <th>Title</th>
                    <th>Category</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th>Requester</th>
                    <th>Assignee</th>
                    <th>SLA Status</th>
                  </tr>
                </thead>
                <tbody>
                  {tickets.map((t) => (
                    <tr
                      key={t.id}
                      className="cursor-pointer"
                      onClick={() => navigate(`/tickets/${t.id}`)}
                    >
                      <td className="fw-semibold text-primary">{t.ticket_number}</td>
                      <td>
                        <div className="fw-medium text-dark text-truncate" style={{ maxWidth: '280px' }}>
                          {t.title}
                        </div>
                        <div className="text-xs text-muted">
                          {new Date(t.created_at).toLocaleString()}
                        </div>
                      </td>
                      <td>
                        <span className="badge bg-light text-dark border">
                          {t.category_name || 'General'}
                        </span>
                      </td>
                      <td>
                        <span className={`badge badge-priority-${t.priority.toLowerCase()}`}>
                          {t.priority}
                        </span>
                      </td>
                      <td>
                        <span className={`badge badge-status badge-status-${t.status.toLowerCase()}`}>
                          {t.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="text-sm">{t.requester_name || 'Requester'}</td>
                      <td className="text-sm">
                        {t.assignee_name ? (
                          <span className="text-dark fw-medium">{t.assignee_name}</span>
                        ) : (
                          <span className="text-muted fst-italic">Unassigned</span>
                        )}
                      </td>
                      <td>
                        {t.is_sla_breached ? (
                          <span className="badge bg-danger-subtle text-danger border border-danger d-inline-flex align-items-center gap-1">
                            <span className="pulse-danger"></span> Breached
                          </span>
                        ) : (
                          <span className="badge bg-success-subtle text-success">Within SLA</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="card-footer bg-white py-3 d-flex justify-content-between align-items-center">
            <span className="text-xs text-muted">
              Page {page} of {totalPages}
            </span>
            <div className="btn-group btn-group-sm">
              <button
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="btn btn-outline-secondary"
              >
                Previous
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
                className="btn btn-outline-secondary"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
