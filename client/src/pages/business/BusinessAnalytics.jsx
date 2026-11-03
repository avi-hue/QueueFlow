import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  Clock,
  Users,
  Layers,
  CheckCircle,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  RefreshCw,
  Play,
  Pause,
  StopCircle,
  UserPlus,
  Zap,
  Activity,
  Sliders
} from 'lucide-react';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { io } from 'socket.io-client';

export const BusinessAnalytics = () => {
  const { business, refreshBusiness, isOwner } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('today'); // 'today' | '7days'
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [showWalkInModal, setShowWalkInModal] = useState(false);
  const [walkInName, setWalkInName] = useState('');
  const [walkInCounter, setWalkInCounter] = useState('');
  const [submittingWalkIn, setSubmittingWalkIn] = useState(false);

  const fetchAnalytics = async () => {
    try {
      const res = await api.get(`/business/analytics?timeframe=${timeframe}`);
      setAnalytics(res.data.data);
    } catch (err) {
      console.error('Failed to fetch analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [timeframe]);

  // Real-time synchronization via Socket.IO
  useEffect(() => {
    const authToken = localStorage.getItem('token') || localStorage.getItem('queueflow_token');
    const socketUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    const socket = io(socketUrl, { auth: { token: authToken } });

    socket.on('queue:updated', fetchAnalytics);
    return () => socket.disconnect();
  }, [timeframe]);

  const handleUpdateStatus = async (newStatus) => {
    try {
      setStatusUpdating(true);
      await api.patch('/business/analytics/status', { status: newStatus });
      await fetchAnalytics();
      await refreshBusiness();
    } catch (err) {
      console.error('Failed to update queue status:', err);
      alert('Failed to update status');
    } finally {
      setStatusUpdating(false);
    }
  };

  const handleAddWalkIn = async (e) => {
    e.preventDefault();
    try {
      setSubmittingWalkIn(true);
      await api.post('/queue/business/queue/walk-in', {
        walkInName: walkInName.trim() || 'Walk-in Guest',
        counterId: walkInCounter || null
      });
      setWalkInName('');
      setShowWalkInModal(false);
      await fetchAnalytics();
    } catch (err) {
      console.error('Failed to create walk-in:', err);
      alert('Failed to create walk-in ticket');
    } finally {
      setSubmittingWalkIn(false);
    }
  };

  if (loading && !analytics) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3 text-sm text-[#667085]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#D5CCC0] border-t-[#2F7D6D]" />
        <span>Aggregating analytics & performance metrics...</span>
      </div>
    );
  }

  const kpis = analytics?.kpis || {};
  const peakHours = analytics?.peakHours || {};
  const customerFlow = analytics?.customerFlow || {};
  const waitTimes = analytics?.waitTimes || {};
  const servicePerf = analytics?.servicePerformance || {};
  const queueStatus = analytics?.queueStatus || 'open';

  // Find max value in hourly breakdown for relative chart heights
  const hourlyData = peakHours.hourlyBreakdown || [];
  const maxArrivalsInChart = Math.max(...hourlyData.map((h) => h.arrivals), 10);

  return (
    <div className="space-y-6">
      {/* Analytics Action Bar & Queue Management */}
      <div className="panel p-5 bg-[#FAF7F0] border border-[#E6DED2]">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="status-badge status-warn">{analytics?.category || 'Service'}</span>
              <span
                className={
                  queueStatus === 'open'
                    ? 'status-badge status-open'
                    : queueStatus === 'paused'
                    ? 'status-badge status-warn'
                    : 'status-badge status-danger'
                }
              >
                <span
                  className={`beacon ${
                    queueStatus === 'open' ? 'bg-[#2F7D6D]' : queueStatus === 'paused' ? 'bg-[#C98A2E]' : 'bg-[#B44A3F]'
                  }`}
                />
                Queue {queueStatus.toUpperCase()}
              </span>
            </div>
            <h2 className="text-xl font-bold text-[#1F2933]">Queue Control & Performance Analytics</h2>
            <p className="text-xs text-[#667085] mt-1">
              Live operational metrics, queue depth triage, and predictive historical traffic intelligence.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Timeframe Selector */}
            <div className="inline-flex rounded-lg border border-[#E6DED2] bg-white p-1 text-xs">
              <button
                onClick={() => setTimeframe('today')}
                className={`rounded-md px-3 py-1 font-semibold transition ${
                  timeframe === 'today' ? 'bg-[#1F2933] text-white shadow-sm' : 'text-[#667085] hover:text-[#1F2933]'
                }`}
              >
                Today (Live)
              </button>
              <button
                onClick={() => setTimeframe('7days')}
                className={`rounded-md px-3 py-1 font-semibold transition ${
                  timeframe === '7days' ? 'bg-[#1F2933] text-white shadow-sm' : 'text-[#667085] hover:text-[#1F2933]'
                }`}
              >
                7-Day Average
              </button>
            </div>

            {/* Quick Walk-In Button */}
            <button
              onClick={() => setShowWalkInModal(true)}
              className="btn-secondary h-9 px-3 text-xs inline-flex items-center gap-1.5 font-bold"
            >
              <UserPlus className="h-3.5 w-3.5 text-[#2F7D6D]" />
              <span>Issue Walk-In</span>
            </button>

            {/* Queue State Management (Owner only) */}
            {isOwner && (
              <div className="inline-flex items-center rounded-lg border border-[#E6DED2] bg-white p-1 gap-1">
                <button
                  onClick={() => handleUpdateStatus('open')}
                  disabled={statusUpdating || queueStatus === 'open'}
                  className={`h-7 px-2.5 rounded text-xs font-bold transition flex items-center gap-1 ${
                    queueStatus === 'open'
                      ? 'bg-[#EBF2EE] text-[#2F7D6D]'
                      : 'text-[#667085] hover:bg-[#F0EAE1] hover:text-[#1F2933]'
                  }`}
                  title="Open queue for incoming customers"
                >
                  <Play className="h-3 w-3" />
                  <span>Open</span>
                </button>
                <button
                  onClick={() => handleUpdateStatus('paused')}
                  disabled={statusUpdating || queueStatus === 'paused'}
                  className={`h-7 px-2.5 rounded text-xs font-bold transition flex items-center gap-1 ${
                    queueStatus === 'paused'
                      ? 'bg-[#FFFBF2] text-[#C98A2E]'
                      : 'text-[#667085] hover:bg-[#F0EAE1] hover:text-[#1F2933]'
                  }`}
                  title="Pause incoming queue entries"
                >
                  <Pause className="h-3 w-3" />
                  <span>Pause</span>
                </button>
                <button
                  onClick={() => handleUpdateStatus('closed')}
                  disabled={statusUpdating || queueStatus === 'closed'}
                  className={`h-7 px-2.5 rounded text-xs font-bold transition flex items-center gap-1 ${
                    queueStatus === 'closed'
                      ? 'bg-[#FDF2F1] text-[#B44A3F]'
                      : 'text-[#667085] hover:bg-[#F0EAE1] hover:text-[#1F2933]'
                  }`}
                  title="Close queue for the day"
                >
                  <StopCircle className="h-3 w-3" />
                  <span>Close</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* KPI Overview Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <KpiCard
          label="Total Customer Flow"
          value={kpis.totalArrivals ?? 0}
          unit="customers"
          sub={`${kpis.totalServed ?? 0} served (${kpis.completionRate ?? 0}% rate)`}
          icon={Users}
          color="#2F7D6D"
        />

        <KpiCard
          label="Average Wait Time"
          value={`~${kpis.avgWaitTimeMin ?? 0}`}
          unit="min"
          sub={`Peak wait recorded: ${kpis.maxWaitTimeMin ?? 0}m`}
          icon={Clock}
          color="#C98A2E"
        />

        <KpiCard
          label="Service Duration"
          value={`~${kpis.avgServiceDurationMin ?? 5}`}
          unit="m / token"
          sub="Blended counter pace"
          icon={Activity}
          color="#2F7D6D"
        />

        <KpiCard
          label="Peak Rush Hour"
          value={peakHours.busiestHour?.label || '12:00 PM'}
          unit=""
          sub={`Peak: ${peakHours.busiestHour?.arrivals || 0} visits/hr`}
          icon={TrendingUp}
          color="#C98A2E"
        />

        <KpiCard
          label="Counter Utilization"
          value={`${kpis.counterUtilizationRate ?? 80}%`}
          unit=""
          sub={`${kpis.activeCountersCount ?? 0}/${kpis.totalCountersCount ?? 0} active lanes`}
          icon={Layers}
          color="#2F7D6D"
        />
      </div>

      {/* Peak Hours & Customer Flow Analysis Chart */}
      <div className="panel p-6">
        <div className="section-rule mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3">
          <div>
            <p className="label-caps">Hourly Traffic Intelligence</p>
            <h3 className="mt-1 text-lg font-bold text-[#1F2933] flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-[#2F7D6D]" />
              Peak Hours & Customer Flow Analysis
            </h3>
          </div>
          <div className="flex items-center gap-4 text-xs text-[#667085]">
            <span className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-sm bg-[#2F7D6D]" />
              <span>Arrivals</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-sm bg-[#C98A2E]" />
              <span>Served Customers</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-[#B44A3F]" />
              <span>Peak Window</span>
            </span>
          </div>
        </div>

        {/* Visual Column Chart */}
        <div className="pt-4 pb-2">
          <div className="grid grid-cols-11 gap-2 sm:gap-3 items-end h-56 border-b border-[#E6DED2] pb-2">
            {hourlyData.map((item) => {
              const arrivalHeightPct = Math.min(100, Math.round((item.arrivals / maxArrivalsInChart) * 100));
              const servedHeightPct = Math.min(100, Math.round((item.served / maxArrivalsInChart) * 100));
              const isPeak = item.trafficLevel === 'Peak';

              return (
                <div key={item.hour} className="group relative flex flex-col items-center h-full justify-end">
                  {/* Tooltip */}
                  <div className="pointer-events-none absolute -top-24 z-20 hidden w-36 -translate-x-1/2 rounded-lg border border-[#E6DED2] bg-[#1F2933] p-2 text-[11px] text-white shadow-xl group-hover:block left-1/2">
                    <p className="font-bold border-b border-gray-700 pb-1">{item.label}</p>
                    <p className="text-gray-300 mt-1">Arrivals: {item.arrivals}</p>
                    <p className="text-gray-300">Served: {item.served}</p>
                    <p className="text-[#C98A2E]">Avg Wait: ~{item.avgWaitMin}m</p>
                  </div>

                  {/* Dual Bars */}
                  <div className="flex items-end gap-1 w-full justify-center h-full">
                    <div
                      style={{ height: `${Math.max(8, arrivalHeightPct)}%` }}
                      className={`w-3 sm:w-4 rounded-t transition-all duration-300 ${
                        isPeak ? 'bg-[#2F7D6D] ring-2 ring-[#B9D4C8]' : 'bg-[#2F7D6D]/80 hover:bg-[#2F7D6D]'
                      }`}
                    />
                    <div
                      style={{ height: `${Math.max(6, servedHeightPct)}%` }}
                      className="w-3 sm:w-4 rounded-t bg-[#C98A2E]/80 hover:bg-[#C98A2E] transition-all duration-300"
                    />
                  </div>

                  {/* Hour Label */}
                  <span className="mt-2 text-[10px] font-semibold text-[#667085] truncate">
                    {item.hour === 12 ? '12p' : item.hour < 12 ? `${item.hour}a` : `${item.hour - 12}p`}
                  </span>

                  {/* Peak Tag */}
                  {isPeak && (
                    <span className="absolute -bottom-5 text-[9px] font-bold text-[#B44A3F] uppercase">
                      Rush
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-[#667085] gap-2 pt-2">
            <span className="flex items-center gap-1.5">
              <Zap className="h-4 w-4 text-[#C98A2E]" />
              <span>
                Peak congestion typically occurs between <strong>11:00 AM – 1:00 PM</strong> and <strong>4:00 PM – 5:30 PM</strong>.
              </span>
            </span>
            <span className="font-medium">Estimated wait during rush increases by ~35%</span>
          </div>
        </div>
      </div>

      {/* Two-Column Analytics: Waiting Times Distribution & Customer Flow Funnel */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Waiting Times Distribution */}
        <div className="panel p-5">
          <div className="section-rule mb-4 pb-3">
            <p className="label-caps">Service Level Compliance</p>
            <h3 className="mt-1 text-base font-bold text-[#1F2933] flex items-center gap-2">
              <Clock className="h-4 w-4 text-[#C98A2E]" />
              Waiting Times Distribution
            </h3>
          </div>

          <div className="space-y-3.5">
            {(waitTimes.distribution || []).map((bucket) => (
              <div key={bucket.range} className="space-y-1">
                <div className="flex items-center justify-between text-xs font-semibold text-[#1F2933]">
                  <span>{bucket.range}</span>
                  <span>{bucket.percent}% ({bucket.count} visitors)</span>
                </div>
                <div className="h-2.5 w-full rounded-full bg-[#F0EAE1] overflow-hidden">
                  <div
                    style={{ width: `${bucket.percent}%` }}
                    className={`h-full rounded-full transition-all duration-500 ${
                      bucket.range === '< 5 min'
                        ? 'bg-[#2F7D6D]'
                        : bucket.range === '5 - 15 min'
                        ? 'bg-[#5F8D72]'
                        : bucket.range === '15 - 30 min'
                        ? 'bg-[#C98A2E]'
                        : 'bg-[#B44A3F]'
                    }`}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-5 grid grid-cols-3 gap-3 border-t border-[#E6DED2] pt-4 text-center">
            <div className="panel-muted p-2">
              <p className="label-caps text-[10px]">Min Wait</p>
              <p className="metric-number text-lg font-bold text-[#2F7D6D] mt-0.5">{waitTimes.minWaitTimeMin ?? 1}m</p>
            </div>
            <div className="panel-muted p-2">
              <p className="label-caps text-[10px]">Avg Wait</p>
              <p className="metric-number text-lg font-bold text-[#1F2933] mt-0.5">~{waitTimes.avgWaitTimeMin ?? 8}m</p>
            </div>
            <div className="panel-muted p-2">
              <p className="label-caps text-[10px]">Max Wait</p>
              <p className="metric-number text-lg font-bold text-[#B44A3F] mt-0.5">{waitTimes.maxWaitTimeMin ?? 22}m</p>
            </div>
          </div>
        </div>

        {/* Customer Flow & Channel Breakdown */}
        <div className="panel p-5">
          <div className="section-rule mb-4 pb-3">
            <p className="label-caps">Channel & Conversion Breakdown</p>
            <h3 className="mt-1 text-base font-bold text-[#1F2933] flex items-center gap-2">
              <Users className="h-4 w-4 text-[#2F7D6D]" />
              Customer Flow & Channels
            </h3>
          </div>

          {/* Join Channel Proportion */}
          <div className="panel-muted p-4 space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-[#1F2933]">
              <span>Join Channel Mix</span>
              <span>
                {customerFlow.channels?.remotePercent ?? 65}% Remote / {customerFlow.channels?.walkInPercent ?? 35}% Walk-in
              </span>
            </div>
            <div className="h-3 w-full rounded-full bg-[#E6DED2] overflow-hidden flex">
              <div
                style={{ width: `${customerFlow.channels?.remotePercent ?? 65}%` }}
                className="h-full bg-[#2F7D6D]"
                title="Remote joins"
              />
              <div
                style={{ width: `${customerFlow.channels?.walkInPercent ?? 35}%` }}
                className="h-full bg-[#C98A2E]"
                title="Walk-in guests"
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-[#667085]">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-[#2F7D6D]" />
                <span>Remote Joins: {customerFlow.channels?.remoteJoins ?? 0}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-[#C98A2E]" />
                <span>Walk-in Guests: {customerFlow.channels?.walkInJoins ?? 0}</span>
              </span>
            </div>
          </div>

          {/* Customer Funnel Metrics */}
          <div className="mt-4 grid grid-cols-4 gap-2 text-center">
            <div className="rounded-lg border border-[#E6DED2] p-2 bg-white">
              <p className="label-caps text-[9px]">Arrived</p>
              <p className="metric-number text-base font-bold text-[#1F2933] mt-1">{customerFlow.funnel?.arrived ?? 0}</p>
            </div>
            <div className="rounded-lg border border-[#B9D4C8] p-2 bg-[#EBF2EE]">
              <p className="label-caps text-[9px] text-[#2F7D6D]">Served</p>
              <p className="metric-number text-base font-bold text-[#2F7D6D] mt-1">{customerFlow.funnel?.served ?? 0}</p>
            </div>
            <div className="rounded-lg border border-[#E6DED2] p-2 bg-white">
              <p className="label-caps text-[9px]">Skipped</p>
              <p className="metric-number text-base font-bold text-[#667085] mt-1">{customerFlow.funnel?.skipped ?? 0}</p>
            </div>
            <div className="rounded-lg border border-[#E6DED2] p-2 bg-white">
              <p className="label-caps text-[9px]">Cancelled</p>
              <p className="metric-number text-base font-bold text-[#667085] mt-1">{customerFlow.funnel?.cancelled ?? 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Service Performance & Counter Efficiency Table */}
      <div className="panel p-5">
        <div className="section-rule mb-4 flex items-center justify-between pb-3">
          <div>
            <p className="label-caps">Counter Throughput & Operations</p>
            <h3 className="mt-1 text-base font-bold text-[#1F2933] flex items-center gap-2">
              <Layers className="h-4 w-4 text-[#2F7D6D]" />
              Service Performance by Counter
            </h3>
          </div>
          <span className="text-xs font-semibold text-[#2F7D6D]">
            {servicePerf.predictionAccuracyScore ?? 94}% Prediction Accuracy
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#E6DED2] text-[#667085] label-caps">
                <th className="pb-2.5 font-bold">Counter Name</th>
                <th className="pb-2.5 font-bold">Status</th>
                <th className="pb-2.5 font-bold">Staff</th>
                <th className="pb-2.5 font-bold">Tokens Served</th>
                <th className="pb-2.5 font-bold">Avg Service Pace</th>
                <th className="pb-2.5 font-bold">Utilization</th>
                <th className="pb-2.5 font-bold text-right">Rating</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0EAE1]">
              {(servicePerf.counters || []).map((counter) => (
                <tr key={counter.counterId} className="hover:bg-[#FAF7F0] transition">
                  <td className="py-3 font-bold text-[#1F2933]">{counter.name}</td>
                  <td className="py-3">
                    <span className={counter.isActive ? 'status-badge status-open' : 'status-badge status-warn'}>
                      <span className={`beacon ${counter.isActive ? 'bg-[#2F7D6D]' : 'bg-[#9CA3AF]'}`} />
                      {counter.isActive ? 'Active' : 'Offline'}
                    </span>
                  </td>
                  <td className="py-3 text-[#667085]">{counter.staffAssigned}</td>
                  <td className="py-3 font-semibold text-[#1F2933]">{counter.tokensServed}</td>
                  <td className="py-3 font-semibold text-[#C98A2E]">~{counter.avgHandlingTimeMin}m / customer</td>
                  <td className="py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-16 rounded-full bg-[#E6DED2] overflow-hidden">
                        <div style={{ width: `${counter.utilizationPercent}%` }} className="h-full bg-[#2F7D6D]" />
                      </div>
                      <span className="font-semibold text-[#1F2933]">{counter.utilizationPercent}%</span>
                    </div>
                  </td>
                  <td className="py-3 text-right">
                    <span
                      className={`font-bold ${
                        counter.efficiencyRating === 'Optimal' ? 'text-[#2F7D6D]' : 'text-[#667085]'
                      }`}
                    >
                      {counter.efficiencyRating}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Walk-in Customer Modal */}
      {showWalkInModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-2xl border border-[#E6DED2] bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-[#1F2933]">Issue Walk-In Token</h3>
            <p className="mt-1 text-xs text-[#667085]">
              Generate a queue token for an on-site customer without a mobile app.
            </p>

            <form onSubmit={handleAddWalkIn} className="mt-4 space-y-4">
              <div>
                <label className="label-caps block mb-1">Customer / Guest Name</label>
                <input
                  type="text"
                  required
                  value={walkInName}
                  onChange={(e) => setWalkInName(e.target.value)}
                  placeholder="e.g. John Smith"
                  className="input-field"
                />
              </div>

              <div>
                <label className="label-caps block mb-1">Assign Service Counter (Optional)</label>
                <select
                  value={walkInCounter}
                  onChange={(e) => setWalkInCounter(e.target.value)}
                  className="input-field"
                >
                  <option value="">Any Available Counter</option>
                  {(business?.counters || [])
                    .filter((c) => c.isActive)
                    .map((counter) => (
                      <option key={counter._id} value={counter._id}>
                        {counter.name}
                      </option>
                    ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowWalkInModal(false)}
                  className="btn-secondary h-9 px-4 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingWalkIn}
                  className="btn-primary h-9 px-4 text-xs font-bold"
                >
                  {submittingWalkIn ? 'Generating...' : 'Issue Token'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const KpiCard = ({ label, value, unit, sub, icon: Icon, color }) => (
  <div className="panel p-4 flex flex-col justify-between">
    <div className="flex items-center justify-between">
      <p className="label-caps">{label}</p>
      <Icon className="h-4 w-4" style={{ color }} />
    </div>
    <div className="my-2">
      <span className="metric-number text-3xl font-bold tracking-tight text-[#1F2933]">{value}</span>
      {unit && <span className="ml-1 text-xs font-semibold text-[#667085]">{unit}</span>}
    </div>
    <p className="text-[11px] text-[#667085] line-clamp-1">{sub}</p>
  </div>
);
