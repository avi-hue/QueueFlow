import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/client';
import { io } from 'socket.io-client';
import { AlertCircle, ArrowRight, CheckCircle, Clock, Layers, Radio, Settings, Store, Users } from 'lucide-react';

export const BusinessDashboard = () => {
  const { business, refreshBusiness, isOwner } = useAuth();
  const [queueData, setQueueData] = useState(null);
  const [queueLoading, setQueueLoading] = useState(true);

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

  const handleCallNext = async (counterId) => {
    try {
      await api.post('/queue/business/queue/call-next', { counterId });
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

  useEffect(() => {
    refreshBusiness();
    fetchQueue();
    const authToken = localStorage.getItem('token') || localStorage.getItem('queueflow_token');
    if (!authToken) return;

    const socketUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    const socket = io(socketUrl, { auth: { token: authToken } });
    socket.on('queue:updated', fetchQueue);
    return () => socket.disconnect();
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
  const servingCount = queueData?.calledTokens?.length || 0;

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
            <Link to="/dashboard/counters" className="btn-secondary">
              <Layers className="h-4 w-4 text-[#2F7D6D]" />
              Counters ({totalCountersCount})
            </Link>
            {isOwner && (
              <Link to="/dashboard/settings" className="btn-primary">
                <Settings className="h-4 w-4" />
                Venue Settings
              </Link>
            )}
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Waiting" value={waitingCount} hint="Customers in line" icon={Users} />
        <Stat label="Serving" value={servingCount} hint="Called to counters" icon={Store} />
        <Stat label="Counters Active" value={`${activeCountersCount}/${totalCountersCount}`} hint="Ready to call tokens" icon={Layers} />
        <Stat label="Service Time" value={`${business.settings?.avgServiceTimeDefault || 5}m`} hint="ETA baseline" icon={Clock} />
      </section>

      <section className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="panel p-5">
          <div className="section-rule mb-4 flex items-center justify-between pb-3">
            <div>
              <p className="label-caps">Counter Lane Selector</p>
              <h2 className="mt-1 text-lg font-bold text-[#1F2933]">Service Counters</h2>
            </div>
            <Link to="/dashboard/counters" className="text-xs font-bold text-[#2F7D6D]">Configure</Link>
          </div>

          {business.counters?.length ? (
            <div className="space-y-2">
              {business.counters.map((counter, idx) => (
                <div key={counter._id || idx} className="flex items-center justify-between rounded-md border border-[#E6DED2] bg-white p-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`beacon ${counter.isActive ? 'bg-[#2F7D6D]' : 'bg-[#9CA3AF]'}`} />
                      <h3 className="text-sm font-bold text-[#1F2933]">{counter.name}</h3>
                    </div>
                    <p className="mt-1 text-xs text-[#667085]">{counter.isActive ? 'Ready for serving' : 'Inactive / paused'}</p>
                  </div>
                  <span className={counter.isActive ? 'status-badge status-open' : 'status-badge status-warn'}>{counter.isActive ? 'Active' : 'Offline'}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-md border border-[#E6DED2] bg-[#F0EAE1] p-4 text-sm text-[#667085]">
              No counters set up yet.
            </div>
          )}
        </div>

        <div className="panel p-5">
          <div className="section-rule mb-4 flex flex-col justify-between gap-3 pb-3 sm:flex-row sm:items-center">
            <div>
              <p className="label-caps">Live Queue Triage</p>
              <h2 className="mt-1 flex items-center gap-2 text-lg font-bold text-[#1F2933]">
                <Radio className="h-4 w-4 text-[#2F7D6D]" />
                Queue Desk
              </h2>
            </div>
            <button onClick={fetchQueue} className="btn-secondary h-9">Refresh</button>
          </div>

          {queueLoading ? (
            <div className="flex justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#D5CCC0] border-t-[#2F7D6D]" />
            </div>
          ) : !queueData ? (
            <div className="py-8 text-center text-sm text-[#667085]">Failed to load queue data.</div>
          ) : (
            <div className="grid gap-4 xl:grid-cols-2">
              <QueueColumn title="Waiting" count={waitingCount} empty="No customers waiting.">
                {queueData.waitingTokens?.map((token) => (
                  <li key={token._id} className="queue-row">
                    <div>
                      <p className="metric-number text-lg font-bold">{token.tokenNumber}</p>
                      <p className="text-xs text-[#667085]">{token.customerName || 'Customer'}</p>
                    </div>
                    <span className="status-badge status-warn">Waiting</span>
                  </li>
                ))}
                {activeCounters.length > 0 && waitingCount > 0 && (
                  <li className="mt-3 border-t border-[#E6DED2] pt-3">
                    <p className="label-caps mb-2">Call next to counter</p>
                    <div className="flex flex-wrap gap-2">
                      {activeCounters.map((counter) => (
                        <button key={counter._id} onClick={() => handleCallNext(counter._id)} className="btn-primary h-9 px-3 text-xs">
                          {counter.name}
                        </button>
                      ))}
                    </div>
                  </li>
                )}
              </QueueColumn>

              <QueueColumn title="Serving" count={servingCount} empty="No customers currently being served.">
                {queueData.calledTokens?.map((token) => (
                  <li key={token._id} className="queue-row">
                    <div>
                      <p className="metric-number text-lg font-bold text-[#2F7D6D]">{token.tokenNumber}</p>
                      <p className="text-xs text-[#667085]">At {token.counterId?.name || 'Counter'}</p>
                    </div>
                    <button onClick={() => handleComplete(token._id)} className="btn-secondary h-9 px-3 text-xs">
                      <CheckCircle className="h-3.5 w-3.5 text-[#2F7D6D]" />
                      Complete
                    </button>
                  </li>
                ))}
              </QueueColumn>
            </div>
          )}
        </div>
      </section>
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
  <div className="rounded-lg border border-[#E6DED2] bg-[#F0EAE1] p-3">
    <div className="mb-2 flex items-center justify-between">
      <h3 className="text-sm font-bold text-[#1F2933]">{title}</h3>
      <span className="metric-number text-sm font-bold text-[#667085]">{count}</span>
    </div>
    {count > 0 ? <ul className="divide-y divide-[#E6DED2] rounded-md border border-[#E6DED2] bg-white">{children}</ul> : <p className="rounded-md border border-[#E6DED2] bg-white p-3 text-xs text-[#667085]">{empty}</p>}
  </div>
);
