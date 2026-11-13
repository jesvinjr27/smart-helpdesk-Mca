import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ReactECharts from 'echarts-for-react';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import { getDashboardSummaryApi, getDashboardTrendsApi, getTicketsApi, getArticlesApi } from '../../api';
import { StatCard } from '../../components/common/StatCard';
import { StatusBadge } from '../../components/common/StatusBadge';
import { PriorityBadge } from '../../components/common/PriorityBadge';
import { PageHeader } from '../../components/common/PageHeader';
import { CardSkeleton, TableSkeleton } from '../../components/common/LoadingSkeleton';

export const DashboardPage = () => {
  const { user, hasRole } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();

  const [summary, setSummary] = useState(null);
  const [trends, setTrends] = useState(null);
  const [myTickets, setMyTickets] = useState([]);
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);

  const isRequesterOnly =
    hasRole(['REQUESTER']) && !hasRole(['AGENT', 'LEAD', 'ORG_ADMIN', 'SYS_ADMIN']);

  const isDark = theme === 'dark';

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
      <div>
        <PageHeader title="Dashboard" subtitle="Loading operational telemetry..." />
        <div className="row g-3 mb-4">
          <div className="col-sm-6 col-xl-3"><CardSkeleton /></div>
          <div className="col-sm-6 col-xl-3"><CardSkeleton /></div>
          <div className="col-sm-6 col-xl-3"><CardSkeleton /></div>
          <div className="col-sm-6 col-xl-3"><CardSkeleton /></div>
        </div>
        <div className="card shadow-sm p-4">
          <TableSkeleton rows={4} cols={5} />
        </div>
      </div>
    );
  }

  // Requester (Student/Employee) View
  if (isRequesterOnly) {
    return (
      <div>
        {/* Welcome Banner */}
        <div
          className="card border-0 text-white p-4 p-md-5 mb-4 rounded-4 shadow-sm"
          style={{
            background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 60%, #6366f1 100%)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div className="row align-items-center position-relative" style={{ zIndex: 1 }}>
            <div className="col-lg-8">
              <span className="badge bg-white bg-opacity-20 text-white px-3 py-1 rounded-pill text-xs mb-2">
                <i className="bi bi-stars me-1"></i>AI-Powered Help Desk
              </span>
              <h2 className="fw-bold mb-2">Welcome back, {user?.full_name}! 👋</h2>
              <p className="mb-0 text-white-50 fs-6" style={{ maxWidth: '580px', lineHeight: 1.5 }}>
                Have an IT issue, equipment problem, or software access question? Submit a ticket or
                explore our local AI-indexed knowledge base for verified step-by-step solutions.
              </p>
            </div>
            <div className="col-lg-4 text-lg-end mt-4 mt-lg-0">
              <button
                onClick={() => navigate('/tickets/new')}
                className="btn btn-light text-primary fw-semibold px-4 py-2.5 rounded-pill shadow-sm"
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
              <div className="card-header d-flex align-items-center justify-content-between py-3">
                <div className="d-flex align-items-center gap-2">
                  <i className="bi bi-ticket-detailed text-primary fs-5"></i>
                  <h6 className="fw-bold mb-0 text-primary-emphasis">My Recent Tickets</h6>
                </div>
                <button
                  onClick={() => navigate('/tickets')}
                  className="btn btn-sm btn-outline-secondary border-0 text-primary text-xs"
                >
                  View All Tickets <i className="bi bi-arrow-right ms-1"></i>
                </button>
              </div>
              <div className="card-body p-0">
                {myTickets.length === 0 ? (
                  <div className="text-center py-5 text-muted">
                    <i className="bi bi-inbox fs-1 d-block mb-2 text-secondary"></i>
                    <p className="mb-0 text-sm">You have no active tickets right now.</p>
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-custom mb-0">
                      <thead>
                        <tr>
                          <th>Ticket #</th>
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
                            <td className="text-truncate" style={{ maxWidth: '260px' }}>
                              <span className="fw-medium text-primary-emphasis">{t.title}</span>
                            </td>
                            <td>
                              <PriorityBadge priority={t.priority} />
                            </td>
                            <td>
                              <StatusBadge status={t.status} />
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
              <div className="card-header py-3 d-flex align-items-center justify-content-between">
                <div className="d-flex align-items-center gap-2">
                  <i className="bi bi-book text-info fs-5"></i>
                  <h6 className="fw-bold mb-0 text-primary-emphasis">Popular Self-Service Guides</h6>
                </div>
                <button
                  onClick={() => navigate('/knowledge-base')}
                  className="btn btn-sm btn-outline-secondary border-0 text-primary text-xs"
                >
                  Browse KB
                </button>
              </div>
              <div className="card-body p-3">
                <div className="d-flex flex-column gap-2.5">
                  {articles.length === 0 ? (
                    <div className="text-muted text-xs text-center py-4">No published articles yet.</div>
                  ) : (
                    articles.map((art) => (
                      <div
                        key={art.id}
                        onClick={() => navigate('/knowledge-base')}
                        className="p-3 border border-default rounded-3 cursor-pointer card-hover-lift"
                        style={{ backgroundColor: 'var(--bg-surface-subtle)' }}
                      >
                        <div className="fw-semibold text-sm text-primary-emphasis mb-1">
                          {art.title}
                        </div>
                        <div className="text-xs text-muted text-truncate mb-2">
                          {art.summary || 'Click to view verified troubleshooting steps.'}
                        </div>
                        <span className="badge bg-secondary-subtle text-secondary text-xs">
                          {art.category_name || 'General'}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Colors for ECharts
  const axisLabelColor = isDark ? '#94a3b8' : '#64748b';
  const splitLineColor = isDark ? '#1e293b' : '#f1f5f9';

  // Ticket Volume Trend Chart
  const volumeChartOptions = {
    tooltip: {
      trigger: 'axis',
      backgroundColor: isDark ? '#1e293b' : '#ffffff',
      borderColor: isDark ? '#334155' : '#e2e8f0',
      textStyle: { color: isDark ? '#f8fafc' : '#0f172a', fontSize: 12 },
    },
    xAxis: {
      type: 'category',
      data: trends?.ticket_volume_by_day?.map((d) => d.date) || [],
      axisLabel: { color: axisLabelColor, fontSize: 11 },
      axisLine: { lineStyle: { color: splitLineColor } },
    },
    yAxis: {
      type: 'value',
      minInterval: 1,
      axisLabel: { color: axisLabelColor, fontSize: 11 },
      splitLine: { lineStyle: { color: splitLineColor } },
    },
    grid: { left: '3%', right: '4%', bottom: '3%', top: '8%', containLabel: true },
    series: [
      {
        data: trends?.ticket_volume_by_day?.map((d) => d.count) || [],
        type: 'line',
        smooth: true,
        showSymbol: false,
        itemStyle: { color: '#3b82f6' },
        lineStyle: { width: 3 },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(59, 130, 246, 0.4)' },
              { offset: 1, color: 'rgba(59, 130, 246, 0.0)' },
            ],
          },
        },
      },
    ],
  };

  // Status Distribution Donut Chart
  const statusChartOptions = {
    tooltip: {
      trigger: 'item',
      backgroundColor: isDark ? '#1e293b' : '#ffffff',
      borderColor: isDark ? '#334155' : '#e2e8f0',
      textStyle: { color: isDark ? '#f8fafc' : '#0f172a', fontSize: 12 },
    },
    legend: {
      bottom: '0%',
      left: 'center',
      itemWidth: 10,
      itemHeight: 10,
      textStyle: { color: axisLabelColor, fontSize: 11 },
    },
    series: [
      {
        name: 'Tickets',
        type: 'pie',
        radius: ['45%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 6,
          borderColor: isDark ? '#111827' : '#ffffff',
          borderWidth: 2,
        },
        label: { show: false },
        data: trends?.status_distribution
          ? Object.entries(trends.status_distribution).map(([k, v]) => ({
              name: k.replace('_', ' '),
              value: v,
            }))
          : [],
      },
    ],
  };

  // Category Breakdown Bar Chart
  const categoryChartOptions = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      backgroundColor: isDark ? '#1e293b' : '#ffffff',
      borderColor: isDark ? '#334155' : '#e2e8f0',
      textStyle: { color: isDark ? '#f8fafc' : '#0f172a', fontSize: 12 },
    },
    xAxis: {
      type: 'value',
      minInterval: 1,
      axisLabel: { color: axisLabelColor, fontSize: 11 },
      splitLine: { lineStyle: { color: splitLineColor } },
    },
    yAxis: {
      type: 'category',
      data: trends?.category_breakdown?.map((c) => c.name) || [],
      axisLabel: { color: axisLabelColor, fontSize: 11, width: 110, overflow: 'truncate' },
      axisLine: { lineStyle: { color: splitLineColor } },
    },
    grid: { left: '3%', right: '4%', bottom: '3%', top: '8%', containLabel: true },
    series: [
      {
        name: 'Tickets',
        type: 'bar',
        data: trends?.category_breakdown?.map((c) => c.count) || [],
        itemStyle: { color: '#6366f1', borderRadius: [0, 6, 6, 0] },
      },
    ],
  };

  return (
    <div>
      <PageHeader
        title="Operations Dashboard"
        subtitle="Real-time incident queue metrics, SLA compliance rates, and agent assignment distribution."
        actions={
          <button
            onClick={() => navigate('/tickets/new')}
            className="btn btn-primary btn-sm rounded-3 shadow-sm px-3"
          >
            <i className="bi bi-plus-lg me-1"></i>Create Ticket
          </button>
        }
      />

      {/* KPI Stat Cards Row */}
      <div className="row g-3 mb-4">
        <div className="col-sm-6 col-xl-3">
          <StatCard
            title="Total Tickets"
            value={summary?.total_tickets ?? 0}
            icon="bi-ticket-perforated"
            variant="primary"
            subtitle="Organization lifetime volume"
            trend={{ text: 'Queue Active', isPositive: true }}
          />
        </div>

        <div className="col-sm-6 col-xl-3">
          <StatCard
            title="Open Incidents"
            value={summary?.open_tickets ?? 0}
            icon="bi-hourglass-split"
            variant="warning"
            subtitle="Active tickets pending resolution"
          />
        </div>

        <div className="col-sm-6 col-xl-3">
          <StatCard
            title="SLA Compliance"
            value={`${summary?.sla_compliance_rate ?? 100}%`}
            icon="bi-patch-check"
            variant="success"
            subtitle={`Avg resolution: ${summary?.avg_resolution_hours ?? 0} hrs`}
          />
        </div>

        <div className="col-sm-6 col-xl-3">
          <StatCard
            title="Critical Incidents"
            value={summary?.critical_tickets ?? 0}
            icon="bi-exclamation-octagon"
            variant="danger"
            pulse={summary?.critical_tickets > 0}
            subtitle={summary?.critical_tickets > 0 ? 'Urgent attention required' : 'Zero active blockers'}
          />
        </div>
      </div>

      {/* Charts Row */}
      <div className="row g-4 mb-4">
        <div className="col-lg-8">
          <div className="card shadow-sm p-3 h-100">
            <div className="d-flex align-items-center justify-content-between mb-2">
              <div>
                <h6 className="fw-bold mb-0 text-primary-emphasis">Ticket Volume Ingestion (7 Days)</h6>
                <span className="text-xs text-muted">Daily ticket arrival rates across all categories</span>
              </div>
              <span className="badge bg-surface-subtle text-muted border border-default">
                Daily Intake
              </span>
            </div>
            <ReactECharts option={volumeChartOptions} style={{ height: '290px' }} />
          </div>
        </div>

        <div className="col-lg-4">
          <div className="card shadow-sm p-3 h-100">
            <div className="d-flex align-items-center justify-content-between mb-2">
              <h6 className="fw-bold mb-0 text-primary-emphasis">Status Distribution</h6>
              <i className="bi bi-pie-chart text-muted"></i>
            </div>
            <ReactECharts option={statusChartOptions} style={{ height: '290px' }} />
          </div>
        </div>
      </div>

      {/* Category Breakdown & Agent Queue Workload */}
      <div className="row g-4">
        <div className="col-lg-6">
          <div className="card shadow-sm p-3 h-100">
            <div className="d-flex align-items-center justify-content-between mb-3">
              <h6 className="fw-bold mb-0 text-primary-emphasis">Tickets by Category</h6>
              <span className="text-xs text-muted">Volume breakdown</span>
            </div>
            <ReactECharts option={categoryChartOptions} style={{ height: '260px' }} />
          </div>
        </div>

        <div className="col-lg-6">
          <div className="card shadow-sm p-3 h-100">
            <div className="d-flex align-items-center justify-content-between mb-3">
              <div>
                <h6 className="fw-bold mb-0 text-primary-emphasis">Agent Queue Workload</h6>
                <span className="text-xs text-muted">Live assignment capacity</span>
              </div>
              <span className="badge bg-primary-subtle text-primary border border-primary-border">
                Active Queue
              </span>
            </div>

            <div className="table-responsive">
              <table className="table table-custom mb-0">
                <thead>
                  <tr>
                    <th>Support Agent</th>
                    <th>Load Distribution</th>
                    <th className="text-end">Assigned Tickets</th>
                  </tr>
                </thead>
                <tbody>
                  {!trends?.agent_workload || trends.agent_workload.length === 0 ? (
                    <tr>
                      <td colSpan="3" className="text-center text-muted py-4 text-xs">
                        No assigned agents currently.
                      </td>
                    </tr>
                  ) : (
                    trends.agent_workload.map((a, i) => {
                      const count = a.active_tickets;
                      const max = Math.max(...trends.agent_workload.map((x) => x.active_tickets), 1);
                      const percent = Math.min(Math.round((count / max) * 100), 100);

                      return (
                        <tr key={i}>
                          <td>
                            <div className="d-flex align-items-center gap-2">
                              <div
                                className="rounded-circle d-flex align-items-center justify-content-center text-white text-xs fw-bold"
                                style={{
                                  width: '28px',
                                  height: '28px',
                                  background: 'var(--primary-gradient)',
                                }}
                              >
                                {a.agent_name?.[0]?.toUpperCase() || 'A'}
                              </div>
                              <span className="fw-medium text-primary-emphasis">{a.agent_name}</span>
                            </div>
                          </td>
                          <td style={{ width: '35%' }}>
                            <div className="progress" style={{ height: '6px' }}>
                              <div
                                className={`progress-bar ${
                                  count > 8 ? 'bg-danger' : count > 4 ? 'bg-warning' : 'bg-primary'
                                }`}
                                role="progressbar"
                                style={{ width: `${percent}%` }}
                              ></div>
                            </div>
                          </td>
                          <td className="text-end">
                            <span className="badge bg-surface-subtle text-primary-emphasis border border-default px-2.5 py-1">
                              {count} active
                            </span>
                          </td>
                        </tr>
                      );
                    })
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
