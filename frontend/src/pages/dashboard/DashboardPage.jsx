import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ReactECharts from 'echarts-for-react';
import { useAuth } from '../../hooks/useAuth';
import { getDashboardSummaryApi, getDashboardTrendsApi, getTicketsApi, getArticlesApi } from '../../api';

export const DashboardPage = () => {
  const { user, hasRole } = useAuth();
  const navigate = useNavigate();

  const [summary, setSummary] = useState(null);
  const [trends, setTrends] = useState(null);
  const [myTickets, setMyTickets] = useState([]);
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);

  const isRequesterOnly =
    hasRole(['REQUESTER']) && !hasRole(['AGENT', 'LEAD', 'ORG_ADMIN', 'SYS_ADMIN']);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        if (isRequesterOnly) {
          const [tResp, aResp] = await Promise.all([
            getTicketsApi({ page: 1, page_size: 5 }),
            getArticlesApi({ status: 'APPROVED' }),
          ]);
          setMyTickets(tResp.data.items || []);
          setArticles(aResp.data.slice(0, 4) || []);
        } else {
          const [sumResp, trendsResp] = await Promise.all([
            getDashboardSummaryApi(),
            getDashboardTrendsApi({ days: 7 }),
          ]);
          setSummary(sumResp.data);
          setTrends(trendsResp.data);
        }
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [isRequesterOnly]);

  if (loading) {
    return (
      <div className="d-flex align-items-center justify-content-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading Dashboard...</span>
        </div>
      </div>
    );
  }

  // Requester (Student/Employee) View
  if (isRequesterOnly) {
    return (
      <div>
        {/* Welcome Banner */}
        <div className="card border-0 bg-primary text-white p-4 mb-4 rounded-4 shadow-sm">
          <div className="row align-items-center">
            <div className="col-md-8">
              <h3 className="fw-bold mb-2">Welcome back, {user?.full_name}! 👋</h3>
              <p className="mb-0 text-white-50">
                Need IT assistance or campus support? Submit a ticket or search our AI-powered
                knowledge base for instant self-service fixes.
              </p>
            </div>
            <div className="col-md-4 text-md-end mt-3 mt-md-0">
              <button
                onClick={() => navigate('/tickets/new')}
                className="btn btn-light text-primary fw-semibold px-4 py-2 rounded-pill shadow-sm"
              >
                <i className="bi bi-plus-circle me-2"></i>Create New Ticket
              </button>
            </div>
          </div>
        </div>

        <div className="row g-4">
          {/* My Tickets */}
          <div className="col-lg-8">
            <div className="card shadow-sm h-100">
              <div className="card-header bg-white py-3 d-flex align-items-center justify-content-between">
                <h6 className="fw-bold mb-0">My Recent Tickets</h6>
                <button
                  onClick={() => navigate('/tickets')}
                  className="btn btn-sm btn-link text-decoration-none"
                >
                  View All Tickets <i className="bi bi-arrow-right"></i>
                </button>
              </div>
              <div className="card-body p-0">
                {myTickets.length === 0 ? (
                  <div className="text-center py-5 text-muted">
                    <i className="bi bi-inbox fs-1 d-block mb-2 text-secondary"></i>
                    You have no active tickets right now.
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-custom mb-0">
                      <thead>
                        <tr>
                          <th>Ticket</th>
                          <th>Subject</th>
                          <th>Priority</th>
                          <th>Status</th>
                          <th>Created</th>
                        </tr>
                      </thead>
                      <tbody>
                        {myTickets.map((t) => (
                          <tr
                            key={t.id}
                            className="cursor-pointer"
                            onClick={() => navigate(`/tickets/${t.id}`)}
                          >
                            <td className="fw-semibold text-primary">{t.ticket_number}</td>
                            <td className="text-truncate" style={{ maxWidth: '240px' }}>
                              {t.title}
                            </td>
                            <td>
                              <span
                                className={`badge badge-priority-${t.priority.toLowerCase()}`}
                              >
                                {t.priority}
                              </span>
                            </td>
                            <td>
                              <span
                                className={`badge badge-status badge-status-${t.status.toLowerCase()}`}
                              >
                                {t.status}
                              </span>
                            </td>
                            <td className="text-muted text-xs">
                              {new Date(t.created_at).toLocaleDateString()}
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

          {/* Quick Knowledge Base Articles */}
          <div className="col-lg-4">
            <div className="card shadow-sm h-100">
              <div className="card-header bg-white py-3">
                <h6 className="fw-bold mb-0">Popular Help Guides</h6>
              </div>
              <div className="card-body">
                <div className="d-flex flex-column gap-3">
                  {articles.map((art) => (
                    <div
                      key={art.id}
                      onClick={() => navigate(`/knowledge-base`)}
                      className="p-3 border rounded-3 bg-light cursor-pointer hover-shadow transition"
                    >
                      <div className="fw-semibold text-sm mb-1">{art.title}</div>
                      <div className="text-xs text-muted text-truncate mb-2">
                        {art.summary || 'Click to view troubleshooting guide.'}
                      </div>
                      <span className="badge bg-secondary-subtle text-secondary text-xs">
                        {art.category_name || 'General'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Agent / Lead / Admin View with ECharts
  const volumeChartOptions = {
    tooltip: { trigger: 'axis' },
    xAxis: {
      type: 'category',
      data: trends?.ticket_volume_by_day?.map((d) => d.date) || [],
      axisLabel: { fontSize: 11 },
    },
    yAxis: { type: 'value', minInterval: 1 },
    grid: { left: '3%', right: '4%', bottom: '3%', top: '8%', containLabel: true },
    series: [
      {
        data: trends?.ticket_volume_by_day?.map((d) => d.count) || [],
        type: 'line',
        smooth: true,
        itemStyle: { color: '#2563eb' },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(37, 99, 235, 0.3)' },
              { offset: 1, color: 'rgba(37, 99, 235, 0.0)' },
            ],
          },
        },
      },
    ],
  };

  const statusChartOptions = {
    tooltip: { trigger: 'item' },
    legend: { bottom: '0%', left: 'center', itemWidth: 10, itemHeight: 10, textStyle: { fontSize: 11 } },
    series: [
      {
        name: 'Tickets',
        type: 'pie',
        radius: ['45%', '70%'],
        avoidLabelOverlap: false,
        label: { show: false },
        data: trends?.status_distribution
          ? Object.entries(trends.status_distribution).map(([k, v]) => ({ name: k, value: v }))
          : [],
      },
    ],
  };

  const categoryChartOptions = {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    xAxis: { type: 'value', minInterval: 1 },
    yAxis: {
      type: 'category',
      data: trends?.category_breakdown?.map((c) => c.name) || [],
      axisLabel: { fontSize: 11, width: 120, overflow: 'truncate' },
    },
    grid: { left: '3%', right: '4%', bottom: '3%', top: '8%', containLabel: true },
    series: [
      {
        name: 'Tickets',
        type: 'bar',
        data: trends?.category_breakdown?.map((c) => c.count) || [],
        itemStyle: { color: '#6366f1', borderRadius: [0, 4, 4, 0] },
      },
    ],
  };

  return (
    <div>
      {/* KPI Cards Row */}
      <div className="row g-3 mb-4">
        <div className="col-sm-6 col-xl-3">
          <div className="card kpi-card p-3 shadow-sm">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <span className="text-xs text-muted text-uppercase fw-bold">Total Tickets</span>
                <h3 className="fw-bold mb-0 mt-1">{summary?.total_tickets ?? 0}</h3>
              </div>
              <div className="bg-primary-subtle text-primary p-3 rounded-circle">
                <i className="bi bi-ticket-perforated fs-4"></i>
              </div>
            </div>
            <div className="mt-2 text-xs text-muted">
              <span>Organization lifetime volume</span>
            </div>
          </div>
        </div>

        <div className="col-sm-6 col-xl-3">
          <div className="card kpi-card warning p-3 shadow-sm">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <span className="text-xs text-muted text-uppercase fw-bold">Open Tickets</span>
                <h3 className="fw-bold mb-0 mt-1 text-warning">{summary?.open_tickets ?? 0}</h3>
              </div>
              <div className="bg-warning-subtle text-warning p-3 rounded-circle">
                <i className="bi bi-hourglass-split fs-4"></i>
              </div>
            </div>
            <div className="mt-2 text-xs text-muted">
              <span>Active queue needing resolution</span>
            </div>
          </div>
        </div>

        <div className="col-sm-6 col-xl-3">
          <div className="card kpi-card success p-3 shadow-sm">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <span className="text-xs text-muted text-uppercase fw-bold">SLA Compliance</span>
                <h3 className="fw-bold mb-0 mt-1 text-success">
                  {summary?.sla_compliance_rate ?? 100}%
                </h3>
              </div>
              <div className="bg-success-subtle text-success p-3 rounded-circle">
                <i className="bi bi-patch-check fs-4"></i>
              </div>
            </div>
            <div className="mt-2 text-xs text-muted">
              <span>Avg resolution: {summary?.avg_resolution_hours ?? 0} hrs</span>
            </div>
          </div>
        </div>

        <div className="col-sm-6 col-xl-3">
          <div className="card kpi-card danger p-3 shadow-sm">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <span className="text-xs text-muted text-uppercase fw-bold">Critical Incidents</span>
                <div className="d-flex align-items-center gap-2 mt-1">
                  <h3 className="fw-bold mb-0 text-danger">{summary?.critical_tickets ?? 0}</h3>
                  {summary?.critical_tickets > 0 && <span className="pulse-danger"></span>}
                </div>
              </div>
              <div className="bg-danger-subtle text-danger p-3 rounded-circle">
                <i className="bi bi-exclamation-octagon fs-4"></i>
              </div>
            </div>
            <div className="mt-2 text-xs text-muted">
              <span>Urgent attention required</span>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="row g-4 mb-4">
        <div className="col-lg-8">
          <div className="card shadow-sm p-3 h-100">
            <div className="d-flex align-items-center justify-content-between mb-2">
              <h6 className="fw-bold mb-0">Ticket Intake Trend (7 Days)</h6>
              <span className="badge bg-light text-muted border">Daily Volume</span>
            </div>
            <ReactECharts option={volumeChartOptions} style={{ height: '280px' }} />
          </div>
        </div>

        <div className="col-lg-4">
          <div className="card shadow-sm p-3 h-100">
            <h6 className="fw-bold mb-2">Status Distribution</h6>
            <ReactECharts option={statusChartOptions} style={{ height: '280px' }} />
          </div>
        </div>
      </div>

      {/* Category Breakdown & Agent Workload Row */}
      <div className="row g-4">
        <div className="col-lg-6">
          <div className="card shadow-sm p-3 h-100">
            <h6 className="fw-bold mb-2">Tickets by Category</h6>
            <ReactECharts option={categoryChartOptions} style={{ height: '260px' }} />
          </div>
        </div>

        <div className="col-lg-6">
          <div className="card shadow-sm p-3 h-100">
            <div className="d-flex align-items-center justify-content-between mb-3">
              <h6 className="fw-bold mb-0">Agent Queue Workload</h6>
              <span className="badge bg-primary-subtle text-primary">Active Assignments</span>
            </div>
            <div className="table-responsive">
              <table className="table table-custom mb-0">
                <thead>
                  <tr>
                    <th>Agent</th>
                    <th className="text-end">Active Tickets</th>
                  </tr>
                </thead>
                <tbody>
                  {trends?.agent_workload?.length === 0 ? (
                    <tr>
                      <td colSpan="2" className="text-center text-muted py-3">
                        No assigned agents currently.
                      </td>
                    </tr>
                  ) : (
                    trends?.agent_workload?.map((a, i) => (
                      <tr key={i}>
                        <td className="fw-medium">{a.agent_name}</td>
                        <td className="text-end">
                          <span className="badge bg-secondary px-3 py-1">
                            {a.active_tickets}
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
      </div>
    </div>
  );
};
