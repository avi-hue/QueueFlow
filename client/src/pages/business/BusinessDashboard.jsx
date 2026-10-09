import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/client';
import { io } from 'socket.io-client';
import {
  Store,
  Layers,
  Clock,
  Users,
  Settings,
  Plus,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Radio
} from 'lucide-react';

export const BusinessDashboard = () => {
  const { user, business, refreshBusiness, isOwner } = useAuth();
  const [loading, setLoading] = useState(false);
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

    const authToken = localStorage.getItem('token');
    if (authToken) {
      const socketUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const socket = io(socketUrl, {
        auth: { token: authToken }
      });
      socket.on('queue:updated', () => {
        fetchQueue();
      });
      return () => socket.disconnect();
    }
  }, []);

  if (!business) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 text-center">
        <div className="glass-card rounded-2xl p-8 max-w-lg mx-auto">
          <AlertCircle className="w-12 h-12 text-amber-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">No Business Profile Found</h2>
          <p className="text-slate-400 text-sm mb-6">
            Your account is not linked to an active business yet.
          </p>
          <Link
            to="/register"
            className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-500"
          >
            Register a Business
          </Link>
        </div>
      </div>
    );
  }

  const activeCountersCount = business.counters?.filter((c) => c.isActive).length || 0;
  const totalCountersCount = business.counters?.length || 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Business Venue Header Card */}
      <div className="glass-card rounded-2xl p-6 sm:p-8 border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -z-0" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                {business.category}
              </span>
              <span
                className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                  business.isActive
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : 'bg-red-500/10 text-red-400 border border-red-500/20'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    business.isActive ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'
                  }`}
                />
                {business.isActive ? 'Queue Open' : 'Queue Paused'}
              </span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              {business.name}
            </h1>
            <p className="text-slate-400 text-sm mt-1 max-w-2xl">{business.description || business.address}</p>
            <p className="text-xs text-slate-500 mt-2 font-mono">{business.address}</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/dashboard/counters"
              className="px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 hover:border-indigo-500/50 text-white text-sm font-semibold transition-all flex items-center gap-2"
            >
              <Layers className="w-4 h-4 text-indigo-400" />
              <span>Manage Counters ({totalCountersCount})</span>
            </Link>

            {isOwner && (
              <Link
                to="/dashboard/settings"
                className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-2"
              >
                <Settings className="w-4 h-4" />
                <span>Venue Settings</span>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="glass-card p-5 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase text-slate-400">Counters Active</span>
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white">{activeCountersCount}</span>
            <span className="text-xs text-slate-500">/ {totalCountersCount} total</span>
          </div>
          <p className="text-xs text-slate-400 mt-2">Ready to call next tokens</p>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase text-slate-400">Default Service Time</span>
            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white">
              {business.settings?.avgServiceTimeDefault || 5}
            </span>
            <span className="text-xs text-slate-500">min / token</span>
          </div>
          <p className="text-xs text-slate-400 mt-2">Baseline for ETA algorithm</p>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase text-slate-400">Max Queue Capacity</span>
            <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white">
              {business.settings?.maxQueueSize === 0 ? 'Unlimited' : business.settings?.maxQueueSize}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-2">Prevents venue overcrowding</p>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase text-slate-400">Remote Joining</span>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <Radio className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-white">
              {business.settings?.allowRemoteJoin ? 'Enabled' : 'Disabled'}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-2">Customers can join from app</p>
        </div>
      </div>

      {/* Counters Grid Section */}
      <div className="glass-card rounded-2xl p-6 border border-slate-800">
        <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-800">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-400" />
              <span>Service Counters Status</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">Configured counters for this location</p>
          </div>

          <Link
            to="/dashboard/counters"
            className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
          >
            <span>Configure All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {business.counters && business.counters.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {business.counters.map((counter, idx) => (
              <div
                key={counter._id || idx}
                className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        counter.isActive ? 'bg-emerald-400' : 'bg-slate-600'
                      }`}
                    />
                    <h4 className="font-bold text-white text-sm">{counter.name}</h4>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    {counter.isActive ? 'Ready for serving' : 'Inactive / Closed'}
                  </p>
                </div>

                <span
                  className={`text-[11px] px-2 py-0.5 rounded font-semibold ${
                    counter.isActive
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {counter.isActive ? 'Active' : 'Offline'}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-slate-400 text-sm mb-3">No counters set up yet.</p>
            <Link
              to="/dashboard/counters"
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold"
            >
              Add First Counter
            </Link>
          </div>
        )}
      </div>

      {/* Live Queue Section */}
      <div className="glass-card rounded-2xl p-6 border border-slate-800">
        <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-800">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-400" />
              <span>Live Queue</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">Manage waiting and currently serving customers</p>
          </div>
          <button
            onClick={() => fetchQueue()}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
          >
            Refresh
          </button>
        </div>

        {queueLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mx-auto"></div>
          </div>
        ) : !queueData ? (
          <div className="text-center py-8 text-slate-400 text-sm">Failed to load queue data.</div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Waiting List */}
              <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-800/50">
                <h3 className="text-sm font-bold text-white mb-3">Waiting ({queueData.waitingTokens?.length || 0})</h3>
                {queueData.waitingTokens && queueData.waitingTokens.length > 0 ? (
                  <ul className="space-y-2">
                    {queueData.waitingTokens.map((token) => (
                      <li key={token._id} className="flex items-center justify-between p-3 rounded-lg bg-slate-900 border border-slate-800">
                        <div>
                          <span className="font-bold text-white text-lg">{token.tokenNumber}</span>
                          <p className="text-xs text-slate-400">{token.customerName || 'Customer'}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-slate-500 py-2">No customers waiting.</p>
                )}
                {business.counters && business.counters.filter(c => c.isActive).length > 0 && queueData.waitingTokens && queueData.waitingTokens.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-slate-800">
                    <p className="text-xs text-slate-400 mb-2">Call next to counter:</p>
                    <div className="flex flex-wrap gap-2">
                      {business.counters.filter(c => c.isActive).map(counter => (
                        <button
                          key={counter._id}
                          onClick={() => handleCallNext(counter._id)}
                          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold"
                        >
                          {counter.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Serving / Called */}
              <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-800/50">
                <h3 className="text-sm font-bold text-white mb-3">Serving ({queueData.calledTokens?.length || 0})</h3>
                {queueData.calledTokens && queueData.calledTokens.length > 0 ? (
                  <ul className="space-y-2">
                    {queueData.calledTokens.map((token) => (
                      <li key={token._id} className="flex items-center justify-between p-3 rounded-lg bg-slate-900 border border-slate-800">
                        <div>
                          <span className="font-bold text-indigo-400 text-lg">{token.tokenNumber}</span>
                          <p className="text-xs text-slate-400">At {token.counterId?.name || 'Counter'}</p>
                        </div>
                        <button
                          onClick={() => handleComplete(token._id)}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          Complete
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-slate-500 py-2">No customers currently being served.</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Module 1 System Status & Next Steps */}
      <div className="p-6 rounded-2xl bg-indigo-950/30 border border-indigo-500/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm mb-1">
            <CheckCircle className="w-4 h-4" />
            <span>Module 1 & 2 Implemented</span>
          </div>
          <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
            User authentication, business profiles, counters, and core live queue state machine are active. Real-time Socket.IO events integrated.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/dashboard/settings"
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
          >
            Review Settings
          </Link>
        </div>
      </div>
    </div>
  );
};

