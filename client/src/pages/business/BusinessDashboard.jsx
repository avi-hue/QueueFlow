import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/client';
import { io } from 'socket.io-client';
import { AlertCircle, ArrowRight, CheckCircle, Clock, Layers, Radio, Settings, Store, Users, BarChart3, Plus, UserPlus, X, SkipForward } from 'lucide-react';
import { BusinessAnalytics } from './BusinessAnalytics';

export const BusinessDashboard = () => {
  const { business, refreshBusiness, isOwner } = useAuth();
  const [queueData, setQueueData] = useState(null);
  const [queueLoading, setQueueLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('queue'); // 'queue' | 'analytics'
  const [showWalkInModal, setShowWalkInModal] = useState(false);
  const [walkInName, setWalkInName] = useState('');
  const [walkInCounter, setWalkInCounter] = useState('');
  const [walkInLoading, setWalkInLoading] = useState(false);
  const [walkInError, setWalkInError] = useState('');

  const fetchQueue = async () => {
    try {
      setQueueLoading(true);
      const res = await api.get('/queue/business/queue');
      setQueueData(res.data.data.queue);
    } catch (err) {
      console.error('Failed to fetch queue', err);
    } finally {
      setQueueLoading(false);
    }
  };

  const handleCallNext = async (counterId = null) => {
    try {
      await api.post('/queue/business/queue/call-next', { counterId: counterId || undefined });
      fetchQueue();
    } catch (err) {
      console.error('Failed to call next', err);
    }
  };

  const handleComplete = async (tokenId) => {
    try {
      await api.post(`/queue/business/queue/complete/${tokenId}`);
      fetchQueue();
    } catch (err) {
      console.error('Failed to complete token', err);
    }
  };

  const handleSkip = async (tokenId) => {
    if (!window.confirm('Mark this customer token as skipped / no-show?')) return;
    try {
      await api.post(`/queue/business/queue/skip/${tokenId}`);
      fetchQueue();
    } catch (err) {
      console.error('Failed to skip token', err);
    }
  };

  const handleAddWalkIn = async (e) => {
    e.preventDefault();
    if (!walkInName.trim()) return;
    setWalkInError('');
    setWalkInLoading(true);

    try {
      await api.post('/queue/business/queue/walk-in', {
        walkInName: walkInName.trim(),
        counterId: walkInCounter || undefined
      });
      setWalkInName('');
      setWalkInCounter('');
      setShowWalkInModal(false);
      fetchQueue();
    } catch (err) {
      setWalkInError(err.response?.data?.message || 'Failed to issue walk-in token');
    } finally {
      setWalkInLoading(false);
    }
  };

  useEffect(() => {
    refreshBusiness();
    fetchQueue();
    const authToken = localStorage.getItem('token') || localStorage.getItem('queueflow_token');
    if (!authToken) return;

    const socketUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    const socket = io(socketUrl, { auth: { token: authToken } });
    socket.on('queue:updated', fetchQueue);
    socket.on('public:queue:updated', fetchQueue);

    // 4-second polling fallback for guaranteed real-time synchronization
    const interval = setInterval(() => {
      fetchQueue();
    }, 4000);

    return () => {
      clearInterval(interval);
      socket.disconnect();
    };
  }, []);

  if (!business) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12 text-center">
        <div className="panel-focus mx-auto max-w-lg p-8">
          <AlertCircle className="mx-auto mb-4 h-12 w-12 text-[#C98A2E]" />
          <h2 className="text-xl font-bold text-[#1F2933]">No Business Profile Found</h2>
          <p className="mt-2 text-sm text-[#667085]">Your account is not linked to an active business yet.</p>
          <Link to="/register" className="btn-primary mt-6">Register a Business</Link>
        </div>
      </div>
    );
  }

  const activeCounters = business.counters?.filter((c) => c.isActive) || [];
  const activeCountersCount = activeCounters.length;
  const totalCountersCount = business.counters?.length || 0;
  const waitingCount = queueData?.waitingTokens?.length || 0;
  const activeServingTokens = [
    ...(queueData?.calledTokens || []),
    ...(queueData?.servingTokens || [])
  ].filter((t, idx, arr) => arr.findIndex((x) => String(x._id) === String(t._id)) === idx);
  const servingCount = activeServingTokens.length;
  const completedCount = queueData?.recentCompletedTokens?.length || 0;

  const liveCounters = (business.counters || []).map((c) => {
    const matchingFromQueue = queueData?.counters?.find((qc) => String(qc._id) === String(c._id));
    if (matchingFromQueue) return matchingFromQueue;

    const currentToken = activeServingTokens.find((t) => String(t.counterId) === String(c._id));
    return {
      ...c,
      isOccupied: Boolean(currentToken),
      status: !c.isActive ? 'offline' : currentToken ? 'busy' : 'available',
      currentToken: currentToken || null
    };
  });

  const emptyCounters = liveCounters.filter((c) => c.status === 'available');
  const busyCounters = liveCounters.filter((c) => c.status === 'busy');

  return (
    <div className="page-wrap space-y-6">
      <section className="panel-focus p-5 sm:p-6">
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-start">
          <div>
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className="status-badge status-warn">{business.category}</span>
              <span className={business.isActive ? 'status-badge status-open' : 'status-badge status-danger'}>
                <span className={`beacon ${business.isActive ? 'bg-[#2F7D6D]' : 'bg-[#B44A3F]'}`} />
                {business.isActive ? 'Queue Open' : 'Queue Paused'}
              </span>
            </div>
            <h1 className="text-3xl font-bold text-[#1F2933] sm:text-4xl">{business.name}</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#667085]">{business.description || business.address}</p>
            <p className="metric-number mt-2 text-xs text-[#667085]">{business.address}</p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setShowWalkInModal(true)}
              className="btn-secondary h-10 px-3 text-xs font-bold"
            >
              <UserPlus className="h-4 w-4 text-[#2F7D6D]" />
              Add Walk-in
            </button>
            <Link to="/dashboard/counters" className="btn-secondary h-10 px-3 text-xs font-bold">
              <Layers className="h-4 w-4 text-[#2F7D6D]" />
              Counters ({totalCountersCount})
            </Link>
            {isOwner && (
              <Link to="/dashboard/settings" className="btn-primary h-10 px-3 text-xs font-bold">
                <Settings className="h-4 w-4" />
                Venue Settings
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* View Switcher Tabs */}
      <div className="flex border-b border-[#E6DED2] gap-1">
        <button
          onClick={() => setActiveTab('queue')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-bold border-b-2 transition ${
            activeTab === 'queue'
              ? 'border-[#2F7D6D] text-[#2F7D6D]'
              : 'border-transparent text-[#667085] hover:text-[#1F2933]'
          }`}
        >
          <Radio className="h-4 w-4" />
          <span>Live Queue Triage</span>
        </button>
        <button
          onClick={() => setActiveTab('analytics')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-bold border-b-2 transition ${
            activeTab === 'analytics'
              ? 'border-[#2F7D6D] text-[#2F7D6D]'
              : 'border-transparent text-[#667085] hover:text-[#1F2933]'
          }`}
        >
          <BarChart3 className="h-4 w-4" />
          <span>Business Analytics Dashboard</span>
        </button>
      </div>

      {activeTab === 'analytics' ? (
        <BusinessAnalytics />
      ) : (
        <>
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <Stat label="Waiting (FIFO)" value={waitingCount} hint="Next in queue order" icon={Users} />
            <Stat label="Serving" value={servingCount} hint="Active at counters" icon={Store} />
            <Stat label="Est. Wait Time" value={`~${queueData?.stats?.estimatedWaitMins ?? 0}m`} hint={queueData?.stats?.prediction ? `${queueData.stats.prediction.confidence} confidence` : "Dynamic ETA"} icon={Clock} />
            <Stat label="Empty Counters" value={`${emptyCounters.length}/${activeCountersCount}`} hint={`${busyCounters.length} busy • ${emptyCounters.length} ready`} icon={Layers} />
            <Stat label="Service Pace" value={`~${queueData?.stats?.prediction?.blendedAvgServiceTime ?? business.settings?.avgServiceTimeDefault ?? 5}m`} hint={queueData?.stats?.prediction?.liveSampleCount ? `Live: ${queueData.stats.prediction.liveAvgServiceTime}m` : "Historical baseline"} icon={Clock} />
          </section>

          <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
            {/* Service Counters Column */}
            <div className="panel p-5">
              <div className="section-rule mb-4 flex items-center justify-between pb-3">
                <div>
                  <p className="label-caps">Service Counter Fleet</p>
                  <h2 className="mt-1 text-lg font-bold text-[#1F2933]">Counters & Lanes</h2>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`status-badge ${emptyCounters.length > 0 ? 'status-open' : 'status-warn'} text-[10px]`}>
                    {emptyCounters.length} Available
                  </span>
                  <Link to="/dashboard/counters" className="text-xs font-bold text-[#2F7D6D]">Configure</Link>
                </div>
              </div>

              {liveCounters?.length ? (
                <div className="space-y-3">
                  {liveCounters.map((counter, idx) => {
                    const isAvail = counter.status === 'available';
                    const isBusy = counter.status === 'busy';
                    const isOffline = counter.status === 'offline';

                    return (
                      <div
                        key={counter._id || idx}
                        className={`rounded-lg border p-3.5 transition ${
                          isBusy
                            ? 'border-[#C98A2E] bg-[#FFFBF2] shadow-xs'
                            : isAvail
                            ? 'border-[#2F7D6D] bg-[#F7FAF8]'
                            : 'border-[#E6DED2] bg-[#FAF7F0] opacity-75'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <span
                                className={`beacon ${
                                  isBusy
                                    ? 'bg-[#C98A2E] animate-pulse'
                                    : isAvail
                                    ? 'bg-[#2F7D6D]'
                                    : 'bg-[#9CA3AF]'
                                }`}
                              />
                              <h3 className="text-sm font-bold text-[#1F2933]">{counter.name}</h3>
                            </div>

                            {isBusy && counter.currentToken ? (
                              <div className="mt-1.5 flex items-center gap-2 text-xs">
                                <span className="metric-number font-bold text-[#C98A2E]">
                                  {counter.currentToken.tokenLabel || counter.currentToken.tokenNumber}
                                </span>
                                <span className="font-bold text-[#1F2933]">
                                  {counter.currentToken.customerName || 'Customer'}
                                </span>
                              </div>
                            ) : (
                              <p className="mt-1 text-xs text-[#667085]">
                                {isAvail ? 'Empty & ready for next customer' : 'Counter is offline / paused'}
                              </p>
                            )}
                          </div>

                          <span
                            className={
                              isBusy
                                ? 'status-badge status-warn text-[10px]'
                                : isAvail
                                ? 'status-badge status-open text-[10px]'
                                : 'status-badge text-[10px]'
                            }
                          >
                            {isBusy ? 'Serving' : isAvail ? 'Empty / Ready' : 'Offline'}
                          </span>
                        </div>

                        {/* Counter Actions */}
                        <div className="mt-3 pt-2.5 border-t border-[#E6DED2]/60 flex items-center justify-between gap-2">
                          {isBusy && counter.currentToken ? (
                            <div className="flex items-center justify-between w-full gap-2">
                              <span className="text-[11px] text-[#667085]">
                                In progress
                              </span>
                              <button
                                onClick={() => handleComplete(counter.currentToken._id)}
                                className="btn-primary h-7 px-2.5 text-xs font-bold flex items-center gap-1 bg-[#2F7D6D] text-white hover:bg-[#256357]"
                                title="Complete service: marks token completed, records in customer visit history, and frees counter"
                              >
                                <CheckCircle className="h-3 w-3" />
                                Complete Service
                              </button>
                            </div>
                          ) : isAvail ? (
                            <div className="flex items-center justify-between w-full gap-2">
                              <span className="text-[11px] text-[#667085]">
                                {waitingCount > 0 ? `${waitingCount} waiting in FIFO queue` : 'Queue empty'}
                              </span>
                              <button
                                onClick={() => handleCallNext(counter._id)}
                                disabled={waitingCount === 0}
                                className="btn-secondary h-7 px-2.5 text-xs font-bold flex items-center gap-1 border-[#2F7D6D] text-[#2F7D6D] hover:bg-[#EBF2EE] disabled:opacity-40 disabled:cursor-not-allowed"
                                title={waitingCount > 0 ? `Call next waiting customer in FIFO line to ${counter.name}` : 'No customers waiting'}
                              >
                                <Radio className="h-3 w-3 text-[#2F7D6D]" />
                                Take Next in Queue
                              </button>
                            </div>
                          ) : (
                            <div className="text-[11px] text-[#667085]">Lane offline</div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-md border border-[#E6DED2] bg-[#F0EAE1] p-4 text-sm text-[#667085]">
                  No counters set up yet.
                </div>
              )}

              {/* Quick Add Walk-In Card */}
              <div className="mt-5 rounded-lg border border-[#E6DED2] bg-[#FAF7F0] p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-bold text-[#1F2933] flex items-center gap-1.5">
                    <UserPlus className="h-3.5 w-3.5 text-[#2F7D6D]" />
                    Issue Walk-in Token
                  </h3>
                </div>
                <p className="text-xs text-[#667085] mb-3">
                  Assign a token for in-person visitors with their customer name into the FIFO queue.
                </p>
                <button
                  onClick={() => setShowWalkInModal(true)}
                  className="btn-primary w-full h-8 text-xs font-bold flex items-center justify-center gap-1.5"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Issue Token for Guest
                </button>
              </div>
            </div>

            {/* Live Queue Desk Column */}
            <div className="panel p-5">
              <div className="section-rule mb-4 flex flex-col justify-between gap-3 pb-3 sm:flex-row sm:items-center">
                <div>
                  <p className="label-caps">FIFO Dispatch & Live Operations</p>
                  <h2 className="mt-1 flex items-center gap-2 text-lg font-bold text-[#1F2933]">
                    <Radio className="h-4 w-4 text-[#2F7D6D]" />
                    Queue Desk
                  </h2>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleCallNext(null)}
                    disabled={waitingCount === 0 || emptyCounters.length === 0}
                    className="btn-primary h-8 px-3 text-xs font-bold flex items-center gap-1.5 shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
                    title={
                      emptyCounters.length === 0
                        ? 'All counters are currently serving. Complete a service above to free a counter.'
                        : waitingCount === 0
                        ? 'No customers waiting in queue'
                        : `Call next FIFO customer to ${emptyCounters[0]?.name}`
                    }
                  >
                    <Radio className="h-3.5 w-3.5" />
                    <span>Call Next (Any Empty Counter)</span>
                    {emptyCounters.length > 0 && (
                      <span className="rounded-full bg-white/20 px-1.5 py-0.5 text-[10px] font-mono">
                        {emptyCounters.length} free
                      </span>
                    )}
                  </button>
                  <button
                    onClick={() => setShowWalkInModal(true)}
                    className="btn-secondary h-8 px-2.5 text-xs font-bold flex items-center gap-1"
                  >
                    <Plus className="h-3 w-3" />
                    Walk-In
                  </button>
                  <button onClick={fetchQueue} className="btn-secondary h-8 px-2.5 text-xs">
                    Refresh
                  </button>
                </div>
              </div>

              {queueLoading ? (
                <div className="flex justify-center py-8">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#D5CCC0] border-t-[#2F7D6D]" />
                </div>
              ) : !queueData ? (
                <div className="py-8 text-center text-sm text-[#667085]">Failed to load queue data.</div>
              ) : (
                <div className="space-y-4">
                  <div className="grid gap-4 xl:grid-cols-2">
                    {/* WAITING QUEUE COLUMN (STRICT FIFO) */}
                    <QueueColumn title="Waiting (FIFO)" count={waitingCount} empty="No customers waiting.">
                      {queueData.waitingTokens?.map((token, idx) => (
                        <li key={token._id} className="p-3 hover:bg-[#FAF7F0] transition">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="metric-number text-base font-bold text-[#1F2933]">
                                  {token.tokenLabel || token.tokenNumber}
                                </span>
                                <span className="text-sm font-bold text-[#1F2933]">
                                  {token.customerName || 'Customer'}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 mt-1 text-xs text-[#667085]">
                                <span className={token.source === 'walk_in' ? 'status-badge status-warn text-[10px]' : 'status-badge status-open text-[10px]'}>
                                  {token.source === 'walk_in' ? 'Walk-in' : 'Remote'}
                                </span>
                                <span>~{token.estimatedWaitAtJoin ?? 5}m est. wait</span>
                              </div>
                            </div>
                            <span className={idx === 0 ? "status-badge status-open text-[10px]" : "status-badge status-warn text-[10px]"}>
                              {idx === 0 ? 'Next in Line (FIFO)' : `#${idx + 1} in Line`}
                            </span>
                          </div>
                        </li>
                      ))}
                      {waitingCount > 0 && (
                        <li className="mt-2 border-t border-[#E6DED2] p-3 bg-[#FAF7F0]">
                          {emptyCounters.length > 0 ? (
                            <>
                              <p className="label-caps mb-2 text-[10px] text-[#2F7D6D]">
                                Dispatch Next FIFO Customer to Empty Counter:
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {emptyCounters.map((counter) => (
                                  <button
                                    key={counter._id}
                                    onClick={() => handleCallNext(counter._id)}
                                    className="btn-primary h-8 px-3 text-xs font-bold flex items-center gap-1.5"
                                  >
                                    <Radio className="h-3 w-3" />
                                    Call to {counter.name}
                                  </button>
                                ))}
                              </div>
                            </>
                          ) : (
                            <div className="flex items-center gap-2 text-xs text-[#667085]">
                              <AlertCircle className="h-4 w-4 text-[#C98A2E] shrink-0" />
                              <span>All counters currently busy. Complete a customer at an occupied counter to free it.</span>
                            </div>
                          )}
                        </li>
                      )}
                    </QueueColumn>

                    {/* SERVING / CALLED QUEUE COLUMN */}
                    <QueueColumn title="Serving / Called" count={servingCount} empty="No customers currently being served.">
                      {activeServingTokens?.map((token) => (
                        <li key={token._id} className="p-3 hover:bg-[#FAF7F0] transition">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="metric-number text-base font-bold text-[#2F7D6D]">
                                  {token.tokenLabel || token.tokenNumber}
                                </span>
                                <span className="text-sm font-bold text-[#1F2933]">
                                  {token.customerName || 'Customer'}
                                </span>
                              </div>
                              <p className="mt-1 text-xs text-[#667085]">
                                Serving at: <strong className="text-[#1F2933]">{token.counterName || token.counterId?.name || 'Counter'}</strong>
                              </p>
                            </div>
                            <div className="flex flex-col gap-1 items-end">
                              <button
                                onClick={() => handleComplete(token._id)}
                                className="btn-primary h-7 px-2.5 text-xs font-bold flex items-center gap-1 bg-[#2F7D6D] text-white hover:bg-[#256357]"
                                title="Complete service: marks token completed, records in customer visit history, and frees counter"
                              >
                                <CheckCircle className="h-3 w-3" />
                                Complete
                              </button>
                              <button
                                onClick={() => handleSkip(token._id)}
                                className="text-[11px] text-[#B44A3F] hover:underline flex items-center gap-0.5"
                              >
                                <SkipForward className="h-3 w-3" />
                                Skip
                              </button>
                            </div>
                          </div>
                        </li>
                      ))}
                    </QueueColumn>
                  </div>

                  {/* RECENTLY COMPLETED LIST */}
                  {completedCount > 0 && (
                    <div className="rounded-lg border border-[#E6DED2] bg-white p-3">
                      <div className="flex items-center justify-between mb-2 pb-1 border-b border-[#E6DED2]">
                        <h4 className="text-xs font-bold text-[#1F2933] flex items-center gap-1.5">
                          <CheckCircle className="h-3.5 w-3.5 text-[#2F7D6D]" />
                          Recently Completed Customers ({completedCount})
                        </h4>
                        <span className="text-[11px] text-[#667085]">Recorded in Customer History</span>
                      </div>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {queueData.recentCompletedTokens?.slice(-6).reverse().map((t) => (
                          <div key={t._id} className="rounded border border-[#E6DED2] bg-[#FAF7F0] p-2 text-xs flex items-center justify-between">
                            <div>
                              <span className="metric-number font-bold text-[#2F7D6D] mr-1.5">{t.tokenLabel || t.tokenNumber}</span>
                              <span className="font-bold text-[#1F2933]">{t.customerName || 'Guest'}</span>
                            </div>
                            <span className="text-[10px] text-[#667085]">{t.counterName || 'Counter'}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>

          {/* Module Complete Status Banner */}
          <section className="panel p-5 bg-[#FAF7F0] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-sm font-bold text-[#2F7D6D]">
                <CheckCircle className="h-4 w-4" />
                <span>Strict FIFO Queue & Dynamic Empty Counter Dispatch Active</span>
              </div>
              <p className="mt-1 text-xs text-[#667085] leading-relaxed max-w-2xl">
                Customers join the queue in strict First-In-First-Out (FIFO) sequence. Any available empty counter can take up the next waiting person in line. When service completes, the visit is saved in the customer's history, the counter immediately frees up, and other waiting customers' queue positions update dynamically.
              </p>
            </div>
            <button
              onClick={() => setActiveTab('analytics')}
              className="btn-secondary h-9 text-xs self-start sm:self-auto font-bold flex items-center gap-1.5"
            >
              <BarChart3 className="h-3.5 w-3.5 text-[#2F7D6D]" />
              <span>Open Analytics</span>
            </button>
          </section>
        </>
      )}

      {/* WALK-IN MODAL */}
      {showWalkInModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="panel-focus w-full max-w-md p-6 bg-white animate-fade-in shadow-xl">
            <div className="flex items-center justify-between border-b border-[#E6DED2] pb-3 mb-4">
              <div className="flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-[#2F7D6D]" />
                <h3 className="text-lg font-bold text-[#1F2933]">Issue Walk-in Token</h3>
              </div>
              <button
                onClick={() => setShowWalkInModal(false)}
                className="text-[#667085] hover:text-[#1F2933]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {walkInError && (
              <div className="mb-4 rounded-md border border-[#E8B8B2] bg-[#FFF0EE] p-3 text-xs text-[#B44A3F]">
                {walkInError}
              </div>
            )}

            <form onSubmit={handleAddWalkIn} className="space-y-4">
              <div>
                <label className="label-caps mb-1.5 block text-xs">Customer Name</label>
                <input
                  type="text"
                  required
                  value={walkInName}
                  onChange={(e) => setWalkInName(e.target.value)}
                  placeholder="e.g. David Kim, Sarah Jenkins"
                  className="input-field"
                  autoFocus
                />
              </div>

              <div>
                <label className="label-caps mb-1.5 block text-xs">Preferred Counter Lane (Optional)</label>
                <select
                  value={walkInCounter}
                  onChange={(e) => setWalkInCounter(e.target.value)}
                  className="input-field"
                >
                  <option value="">Any Active Counter</option>
                  {business.counters?.filter((c) => c.isActive).map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowWalkInModal(false)}
                  className="btn-secondary h-9 px-4 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={walkInLoading || !walkInName.trim()}
                  className="btn-primary h-9 px-4 text-xs font-bold"
                >
                  {walkInLoading ? 'Issuing...' : 'Issue Token'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const Stat = ({ label, value, hint, icon: Icon }) => (
  <div className="panel p-4">
    <div className="flex items-center justify-between">
      <p className="label-caps">{label}</p>
      <Icon className="h-4 w-4 text-[#2F7D6D]" />
    </div>
    <p className="metric-number mt-3 text-3xl font-bold">{value}</p>
    <p className="mt-1 text-xs text-[#667085]">{hint}</p>
  </div>
);

const QueueColumn = ({ title, count, empty, children }) => (
  <div className="rounded-lg border border-[#E6DED2] bg-[#F0EAE1] p-3 flex flex-col justify-between">
    <div>
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-bold text-[#1F2933]">{title}</h3>
        <span className="metric-number text-sm font-bold text-[#667085]">{count}</span>
      </div>
      {count > 0 ? (
        <ul className="divide-y divide-[#E6DED2] rounded-md border border-[#E6DED2] bg-white">
          {children}
        </ul>
      ) : (
        <p className="rounded-md border border-[#E6DED2] bg-white p-3 text-xs text-[#667085]">{empty}</p>
      )}
    </div>
  </div>
);
