import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ReactECharts from 'echarts-for-react';
import { useAuth } from '../../hooks/useAuth';
import {
  getDashboardSummaryApi,
  getDashboardTrendsApi,
  getTicketsApi,
  getArticlesApi,
} from '../../api';
import { StatCard } from '../../components/common/StatCard';
import { StatusBadge } from '../../components/common/StatusBadge';
import { PriorityBadge } from '../../components/common/PriorityBadge';
import { PageHeader } from '../../components/common/PageHeader';
import { CardSkeleton, TableSkeleton } from '../../components/common/LoadingSkeleton';

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
      <div className="space-y-6">
        <PageHeader title="Dashboard" subtitle="Loading operational telemetry..." />
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
        <div className="bg-app-background border border-brand-primary/15 rounded-xl p-5 shadow-subtle">
          <TableSkeleton rows={4} cols={5} />
        </div>
      </div>
    );
  }

  // Requester (Student/Employee) View
  if (isRequesterOnly) {
    return (
      <div className="space-y-6">
        {/* Welcome Banner */}
        <div className="relative overflow-hidden bg-brand-primary rounded-2xl p-6 sm:p-8 text-white shadow-subtle border border-brand-primary/30 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="relative z-10 max-w-xl">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/10 text-brand-accent border border-white/20 mb-3">
              <i className="bi bi-stars" />
              <span>AI-Powered Help Desk</span>
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2 text-white">
              Welcome back, {user?.full_name}! 👋
            </h2>
            <p className="text-white/80 text-sm leading-relaxed">
              Have an IT issue, equipment problem, or software access question? Submit a ticket or
              explore our local AI-indexed knowledge base for verified step-by-step solutions.
            </p>
          </div>
          <div className="relative z-10 flex-shrink-0">
            <button
              onClick={() => navigate('/tickets/new')}
              className="px-5 py-2.5 bg-brand-accent text-brand-primary hover:bg-brand-accent/90 font-semibold text-sm rounded-xl shadow-subtle transition-all inline-flex items-center gap-2"
            >
              <i className="bi bi-plus-circle text-base" />
              <span>Create New Ticket</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* My Tickets */}
          <div className="lg:col-span-8">
            <div className="bg-app-background border border-brand-primary/15 rounded-xl shadow-subtle overflow-hidden h-full flex flex-col">
              <div className="px-5 py-4 border-b border-brand-primary/15 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <i className="bi bi-ticket-detailed text-brand-primary text-lg" />
                  <h3 className="font-bold text-sm text-brand-primary">
                    My Recent Tickets
                  </h3>
                </div>
                <button
                  onClick={() => navigate('/tickets')}
                  className="text-xs font-medium text-brand-primary hover:underline inline-flex items-center gap-1"
                >
                  <span>View All Tickets</span>
                  <i className="bi bi-arrow-right" />
                </button>
              </div>

              <div className="flex-1 overflow-x-auto">
                {myTickets.length === 0 ? (
                  <div className="text-center py-12 text-brand-secondary">
                    <i className="bi bi-inbox text-3xl block mb-2" />
                    <p className="text-sm">You have no active tickets right now.</p>
                  </div>
                ) : (
                  <table className="w-full text-left border-collapse min-w-[500px]">
                    <thead className="bg-brand-secondary/15 border-b border-brand-primary/15 text-[11px] font-semibold uppercase tracking-wider text-brand-primary">
                      <tr>
                        <th className="px-4 py-3">Ticket #</th>
                        <th className="px-4 py-3">Subject</th>
                        <th className="px-4 py-3">Priority</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3">Created</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-brand-primary/10 text-sm">
                      {myTickets.map((t) => (
                        <tr
                          key={t.id}
                          onClick={() => navigate(`/tickets/${t.id}`)}
                          className="hover:bg-brand-accent/15 cursor-pointer transition-colors"
                        >
                          <td className="px-4 py-3 font-semibold text-brand-primary font-mono text-xs">
                            {t.ticket_number}
                          </td>
                          <td className="px-4 py-3 max-w-[240px] truncate font-medium text-brand-primary">
                            {t.title}
                          </td>
                          <td className="px-4 py-3">
                            <PriorityBadge priority={t.priority} />
                          </td>
                          <td className="px-4 py-3">
                            <StatusBadge status={t.status} />
                          </td>
                          <td className="px-4 py-3 text-xs text-brand-secondary">
                            {new Date(t.created_at).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>

          {/* Popular Self-Service Guides */}
          <div className="lg:col-span-4">
            <div className="bg-app-background border border-brand-primary/15 rounded-xl shadow-subtle p-5 h-full flex flex-col">
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-brand-primary/15">
                <div className="flex items-center gap-2">
                  <i className="bi bi-book text-brand-primary text-lg" />
                  <h3 className="font-bold text-sm text-brand-primary">
                    Self-Service Guides
                  </h3>
                </div>
                <button
                  onClick={() => navigate('/knowledge-base')}
                  className="text-xs font-medium text-brand-primary hover:underline"
                >
                  Browse KB
                </button>
              </div>

              <div className="flex-1 space-y-2.5">
                {articles.map((art) => (
                  <div
                    key={art.id}
                    onClick={() => navigate('/knowledge-base')}
                    className="p-3 rounded-xl border border-brand-primary/15 hover:border-brand-primary/40 bg-app-background hover:bg-brand-accent/15 transition-all cursor-pointer group"
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-xs font-semibold text-brand-primary truncate">
                        {art.title}
                      </span>
                      <i className="bi bi-chevron-right text-xs text-brand-secondary flex-shrink-0" />
                    </div>
                    <p className="text-[11px] text-brand-secondary line-clamp-1">
                      {art.summary || 'Click to view troubleshooting steps...'}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Admin / Agent / Team Lead View
  const axisLabelColor = '#7aaace';
  const splitLineColor = 'rgba(122, 170, 206, 0.2)';

  // Volume Trends Chart - Using Official Palette (#355872, #7aaace, #9cd5ff)
  const volumeChartOptions = {
    tooltip: {
      trigger: 'axis',
      backgroundColor: '#f7f8f0',
      borderColor: '#7aaace',
      textStyle: { color: '#355872', fontSize: 12 },
    },
    grid: { left: '3%', right: '4%', bottom: '3%', top: '10%', containLabel: true },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: trends?.daily_volume?.map((d) => d.date) || [],
      axisLabel: { color: axisLabelColor, fontSize: 11 },
      axisLine: { lineStyle: { color: splitLineColor } },
    },
    yAxis: {
      type: 'value',
      minInterval: 1,
      axisLabel: { color: axisLabelColor, fontSize: 11 },
      splitLine: { lineStyle: { color: splitLineColor } },
    },
    series: [
      {
        name: 'New Tickets',
        data: trends?.daily_volume?.map((d) => d.count) || [],
        type: 'line',
        smooth: true,
        showSymbol: false,
        itemStyle: { color: '#355872' },
        lineStyle: { width: 3, color: '#355872' },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(53, 88, 114, 0.35)' },
              { offset: 1, color: 'rgba(156, 213, 255, 0.05)' },
            ],
          },
        },
      },
    ],
  };

  // Status Distribution Donut Chart - Using Official Palette
  const statusChartOptions = {
    tooltip: {
      trigger: 'item',
      backgroundColor: '#f7f8f0',
      borderColor: '#7aaace',
      textStyle: { color: '#355872', fontSize: 12 },
    },
    color: ['#355872', '#7aaace', '#9cd5ff', 'rgba(53, 88, 114, 0.5)'],
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
          borderColor: '#f7f8f0',
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

  // Category Breakdown Bar Chart - Using Official Palette
  const categoryChartOptions = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      backgroundColor: '#f7f8f0',
      borderColor: '#7aaace',
      textStyle: { color: '#355872', fontSize: 12 },
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
        itemStyle: { color: '#7aaace', borderRadius: [0, 6, 6, 0] },
      },
    ],
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Operations Dashboard"
        subtitle="Real-time incident queue metrics, SLA compliance rates, and agent assignment distribution."
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

      {/* KPI Stat Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="Total Tickets"
          value={summary?.total_tickets ?? 0}
          icon="bi-ticket-perforated"
          variant="primary"
          subtitle="Organization lifetime volume"
          trend={{ text: 'Queue Active', isPositive: true }}
        />

        <StatCard
          title="Open Incidents"
          value={summary?.open_tickets ?? 0}
          icon="bi-hourglass-split"
          variant="warning"
          subtitle="Active tickets pending resolution"
        />

        <StatCard
          title="SLA Compliance"
          value={`${summary?.sla_compliance_rate ?? 100}%`}
          icon="bi-patch-check"
          variant="success"
          subtitle={`Avg resolution: ${summary?.avg_resolution_hours ?? 0} hrs`}
        />

        <StatCard
          title="Critical Incidents"
          value={summary?.critical_tickets ?? 0}
          icon="bi-exclamation-octagon"
          variant="danger"
          pulse={summary?.critical_tickets > 0}
          subtitle={summary?.critical_tickets > 0 ? 'Urgent attention required' : 'Zero active blockers'}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-8">
          <div className="bg-app-background border border-brand-primary/15 rounded-xl p-5 shadow-subtle h-full">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-bold text-sm text-brand-primary">
                  Ticket Volume Ingestion (7 Days)
                </h3>
                <span className="text-xs text-brand-secondary">
                  Daily ticket arrival rates across all categories
                </span>
              </div>
              <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-brand-secondary/15 text-brand-primary border border-brand-secondary/30">
                Daily Intake
              </span>
            </div>
            <ReactECharts option={volumeChartOptions} style={{ height: '290px', width: '100%' }} />
          </div>
        </div>

        <div className="lg:col-span-4">
          <div className="bg-app-background border border-brand-primary/15 rounded-xl p-5 shadow-subtle h-full">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-sm text-brand-primary">
                Status Distribution
              </h3>
              <i className="bi bi-pie-chart text-brand-secondary" />
            </div>
            <ReactECharts option={statusChartOptions} style={{ height: '290px', width: '100%' }} />
          </div>
        </div>
      </div>

      {/* Category Breakdown & Agent Queue Workload */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-app-background border border-brand-primary/15 rounded-xl p-5 shadow-subtle h-full">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-sm text-brand-primary">
              Tickets by Category
            </h3>
            <span className="text-xs text-brand-secondary">Volume breakdown</span>
          </div>
          <ReactECharts option={categoryChartOptions} style={{ height: '260px', width: '100%' }} />
        </div>

        <div className="bg-app-background border border-brand-primary/15 rounded-xl p-5 shadow-subtle h-full flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-sm text-brand-primary">
                Agent Queue Workload
              </h3>
              <span className="text-xs text-brand-secondary">Live assignment capacity</span>
            </div>
            <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-brand-secondary/15 text-brand-primary border border-brand-secondary/30">
              Active Queue
            </span>
          </div>

          <div className="flex-1 overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[360px]">
              <thead className="bg-brand-secondary/15 border-b border-brand-primary/15 text-[11px] font-semibold uppercase tracking-wider text-brand-primary">
                <tr>
                  <th className="px-3.5 py-2.5">Support Agent</th>
                  <th className="px-3.5 py-2.5">Load Distribution</th>
                  <th className="px-3.5 py-2.5 text-right">Assigned</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-primary/10 text-sm">
                {!trends?.agent_workload || trends.agent_workload.length === 0 ? (
                  <tr>
                    <td colSpan="3" className="text-center text-brand-secondary py-6 text-xs">
                      No assigned agents currently.
                    </td>
                  </tr>
                ) : (
                  trends.agent_workload.map((a, i) => {
                    const count = a.active_tickets;
                    const max = Math.max(...trends.agent_workload.map((x) => x.active_tickets), 1);
                    const percent = Math.min(Math.round((count / max) * 100), 100);

                    return (
                      <tr key={i} className="hover:bg-brand-accent/15 transition-colors">
                        <td className="px-3.5 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-brand-primary flex items-center justify-center text-white text-xs font-bold shadow-xs flex-shrink-0">
                              {a.agent_name?.[0]?.toUpperCase() || 'A'}
                            </div>
                            <span className="font-medium text-brand-primary text-xs truncate">
                              {a.agent_name}
                            </span>
                          </div>
                        </td>
                        <td className="px-3.5 py-3 w-[35%]">
                          <div className="w-full bg-brand-secondary/20 h-2 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-300 bg-brand-primary"
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                        </td>
                        <td className="px-3.5 py-3 text-right">
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-brand-secondary/15 text-brand-primary border border-brand-secondary/30">
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
  );
};
