import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Clock, Radio, Users, Store, CheckCircle, MapPin, Calendar, History, ArrowRight, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { io } from 'socket.io-client';
import api from '../../api/client';

export const MyQueuePage = () => {
  const [tokenData, setTokenData] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [lastCompletedNotice, setLastCompletedNotice] = useState(null);
  const prevTokenRef = useRef(null);

  const fetchToken = useCallback(async () => {
    try {
      const response = await api.get('/queue/my-token');
      const newToken = response.data.data?.token || null;

      // If user had an active called or serving token and now has none, it just completed!
      if (prevTokenRef.current && !newToken && (prevTokenRef.current.status === 'called' || prevTokenRef.current.status === 'serving')) {
        setLastCompletedNotice({
          businessName: prevTokenRef.current.businessName,
          tokenLabel: prevTokenRef.current.tokenLabel || prevTokenRef.current.tokenNumber
        });
      }
      prevTokenRef.current = newToken;
      setTokenData(response.data.data);
    } catch (error) {
      if (error.response?.status === 404) setTokenData(null);
      else console.error('Failed to fetch token:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchHistory = useCallback(async () => {
    try {
      setHistoryLoading(true);
      const res = await api.get('/queue/my-history');
      setHistory(res.data.data?.history || []);
    } catch (err) {
      console.error('Failed to fetch history:', err);
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  const refreshAll = useCallback(() => {
    fetchToken();
    fetchHistory();
  }, [fetchToken, fetchHistory]);

  useEffect(() => {
    refreshAll();
    const authToken = localStorage.getItem('token') || localStorage.getItem('queueflow_token');
    if (!authToken) return;

    const socketUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    const socket = io(socketUrl, { auth: { token: authToken } });

    socket.on('connect', () => {
      if (tokenData?.token?.businessId) {
        socket.emit('business:watch', { businessId: tokenData.token.businessId });
      }
      if (tokenData?.token?._id) {
        socket.emit('token:watch', { tokenId: tokenData.token._id });
      }
    });

    socket.on('token:updated', refreshAll);
    socket.on('queue:updated', refreshAll);
    socket.on('public:queue:updated', fetchToken);

    // Auto-sync polling every 4 seconds to guarantee queue position updates
    const pollInterval = setInterval(() => {
      fetchToken();
    }, 4000);

    return () => {
      clearInterval(pollInterval);
      socket.disconnect();
    };
  }, [refreshAll]);

  // When tokenData changes, make sure socket is watching the active business
  useEffect(() => {
    const authToken = localStorage.getItem('token') || localStorage.getItem('queueflow_token');
    if (!authToken || !tokenData?.token?.businessId) return;

    const socketUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    const socket = io(socketUrl, { auth: { token: authToken } });
    socket.emit('business:watch', { businessId: tokenData.token.businessId });
    socket.emit('token:watch', { tokenId: tokenData.token._id });

    return () => socket.disconnect();
  }, [tokenData?.token?.businessId, tokenData?.token?._id]);

  const token = tokenData?.token;
  const position = token?.position;
  const estimatedWaitMins = token?.estimatedWaitMins;
  const tokenLabel = token?.tokenLabel || token?.tokenNumber;
  const isCalled = token?.status === 'called';
  const isServing = token?.status === 'serving';

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Header with live sync indicator */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[#E6DED2] pb-5">
        <div>
          <p className="label-caps">Customer Portal</p>
          <h1 className="mt-1 text-3xl font-bold text-[#1F2933]">My Queue & Shop Visits</h1>
          <p className="mt-1 text-sm text-[#667085]">
            Track live line position, view called alerts, and see history of shops where your service completed.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="flex items-center gap-1.5 rounded-full border border-[#B9D4C8] bg-[#EBF2EE] px-3 py-1 text-xs font-bold text-[#2F7D6D]">
            <span className="beacon bg-[#2F7D6D]" />
            Live Synced
          </span>
          <button onClick={refreshAll} className="btn-secondary h-8 px-2.5 text-xs">
            Refresh
          </button>
        </div>
      </div>

      {/* Completion Alert Banner if service just completed */}
      {lastCompletedNotice && (
        <div className="rounded-lg border-2 border-[#2F7D6D] bg-[#EBF2EE] p-4 flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-[#2F7D6D] mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-bold text-[#1F2933]">
                Service Completed at {lastCompletedNotice.businessName}!
              </p>
              <p className="text-xs text-[#667085] mt-0.5">
                Token {lastCompletedNotice.tokenLabel} has been marked completed by the shop staff. It is now saved in your Visit History below.
              </p>
            </div>
          </div>
          <button
            onClick={() => setLastCompletedNotice(null)}
            className="text-xs font-bold text-[#2F7D6D] hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* SECTION 1: ACTIVE QUEUE TOKEN */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Radio className="h-4 w-4 text-[#2F7D6D]" />
            <h2 className="text-lg font-bold text-[#1F2933]">Active Queue Token</h2>
          </div>
          {token && (
            <span className={isCalled ? 'status-badge status-open' : isServing ? 'status-badge status-open' : 'status-badge status-warn'}>
              <span className={`beacon ${isCalled || isServing ? 'bg-[#2F7D6D]' : 'bg-[#C98A2E]'}`} />
              {token.status.toUpperCase()}
            </span>
          )}
        </div>

        {loading ? (
          <div className="panel flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#D5CCC0] border-t-[#2F7D6D]" />
          </div>
        ) : !token ? (
          <div className="panel p-8 text-center bg-[#FFFDF9]">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-lg border border-[#E6DED2] bg-[#F0EAE1] text-[#2F7D6D]">
              <Clock className="h-7 w-7" />
            </div>
            <p className="label-caps">Queue Desk</p>
            <h3 className="mt-1 text-xl font-bold text-[#1F2933]">No Active Token in Line</h3>
            <p className="mx-auto mt-2 max-w-md text-sm text-[#667085]">
              You are not currently waiting in any shop queue. Browse nearby shops to join virtually without standing in line.
            </p>
            <Link to="/discover" className="btn-primary mt-5 inline-flex items-center gap-2 h-10 px-5 text-sm">
              <Store className="h-4 w-4" />
              Discover & Join Queues
            </Link>
          </div>
        ) : (
          <div className={`panel-focus overflow-hidden ${isCalled ? 'border-2 border-[#2F7D6D] shadow-md' : ''}`}>
            {/* Business Header */}
            <div className="border-b border-[#E6DED2] bg-[#F0EAE1] px-6 py-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <span className="status-badge status-warn text-[10px] mb-1 inline-block">
                    {token.businessCategory || 'Venue'}
                  </span>
                  <h3 className="text-xl font-bold text-[#1F2933]">{token.businessName || 'Venue'}</h3>
                  {token.businessAddress && (
                    <p className="text-xs text-[#667085] flex items-center gap-1 mt-0.5">
                      <MapPin className="h-3 w-3" />
                      {token.businessAddress}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <span className="label-caps block text-[10px]">Queue Status</span>
                  <span className="text-xs font-bold text-[#2F7D6D] capitalize">{token.queueStatus || 'Open'}</span>
                </div>
              </div>
            </div>

            <div className="p-6 text-center sm:p-8">
              {/* Token Number Display */}
              <div className="mx-auto flex flex-col items-center justify-center rounded-xl border border-[#E6DED2] bg-white px-8 py-6 max-w-sm shadow-sm">
                <span className="label-caps text-xs text-[#667085]">Your Token Number</span>
                <span className="metric-number text-5xl font-extrabold tracking-wide text-[#1F2933] mt-1">
                  {tokenLabel}
                </span>
                <span className="text-xs text-[#667085] mt-1">
                  Held by: <strong className="text-[#1F2933]">{token.customerName || 'You'}</strong>
                </span>
              </div>

              {/* Status Alert Banner */}
              {isCalled ? (
                <div className="mx-auto mt-5 max-w-md rounded-lg border-2 border-[#2F7D6D] bg-[#EBF2EE] p-4 text-center animate-pulse">
                  <span className="text-xs uppercase font-extrabold tracking-wider text-[#2F7D6D]">
                    You Have Been Called!
                  </span>
                  <p className="mt-1 text-base font-bold text-[#1F2933]">
                    Please proceed to <span className="underline decoration-[#2F7D6D] font-extrabold">{token.counterName || 'Service Desk'}</span> now.
                  </p>
                </div>
              ) : isServing ? (
                <div className="mx-auto mt-5 max-w-md rounded-lg border-2 border-[#2F7D6D] bg-[#EBF2EE] p-4 text-center">
                  <span className="text-xs uppercase font-extrabold tracking-wider text-[#2F7D6D]">
                    Currently Being Served
                  </span>
                  <p className="mt-1 text-base font-bold text-[#1F2933]">
                    In service at <span className="underline decoration-[#2F7D6D]">{token.counterName || 'Counter'}</span>.
                  </p>
                </div>
              ) : position > 0 && position <= 3 ? (
                <div className="mx-auto mt-5 max-w-md rounded-lg border-2 border-[#C98A2E] bg-[#FFFBF2] p-4 text-center">
                  <span className="text-xs uppercase font-extrabold tracking-wider text-[#C98A2E]">
                    Turn Approaching Alert
                  </span>
                  <p className="mt-1 text-sm font-bold text-[#1F2933]">
                    You are #{position} in line (~{estimatedWaitMins}m). Please start heading toward the shop counters!
                  </p>
                </div>
              ) : null}

              {/* Position and Wait Metrics */}
              <div className="mx-auto mt-6 grid max-w-md grid-cols-3 gap-3">
                <div className="panel-muted p-3">
                  <Users className="mx-auto mb-1.5 h-4 w-4 text-[#2F7D6D]" />
                  <p className="label-caps text-[10px]">Your Position</p>
                  <p className="metric-number mt-1 text-2xl font-bold">
                    {position > 0 ? `#${position}` : isCalled ? 'Called' : 'Next'}
                  </p>
                </div>
                <div className="panel-muted p-3">
                  <Clock className="mx-auto mb-1.5 h-4 w-4 text-[#C98A2E]" />
                  <p className="label-caps text-[10px]">Est. Wait</p>
                  <p className="metric-number mt-1 text-2xl font-bold">{estimatedWaitMins ?? 0}m</p>
                </div>
                <div className="panel-muted p-3">
                  <Store className="mx-auto mb-1.5 h-4 w-4 text-[#2F7D6D]" />
                  <p className="label-caps text-[10px]">Now Serving</p>
                  <p className="metric-number mt-1 text-2xl font-bold">
                    {token.currentServingLabel || (token.currentServingNumber ? `#${token.currentServingNumber}` : '—')}
                  </p>
                </div>
              </div>

              {/* Module 3: Smart Wait-Time Prediction Breakdown */}
              {token.prediction && (
                <div className="mx-auto mt-5 max-w-md panel p-4 text-left border border-[#E6DED2] bg-[#FAF7F0]">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#1F2933] flex items-center gap-1.5">
                      <span className="beacon bg-[#2F7D6D]" />
                      Smart Wait-Time Prediction
                    </span>
                    <span className="status-badge status-open uppercase text-[10px]">
                      {token.prediction.confidence} Confidence
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mt-3 text-xs">
                    <div>
                      <span className="label-caps block text-[10px]">Active Counters</span>
                      <span className="metric-number font-bold text-[#1F2933] mt-0.5 block">
                        {token.prediction.activeCounters} open
                      </span>
                    </div>
                    <div>
                      <span className="label-caps block text-[10px]">Blended Service Pace</span>
                      <span className="metric-number font-bold text-[#1F2933] mt-0.5 block">
                        ~{token.prediction.blendedAvgServiceTime}m / token
                      </span>
                    </div>
                  </div>
                  <p className="mt-2.5 pt-2 border-t border-[#E6DED2] text-[11px] text-[#667085]">
                    Dynamic calculation blending live counter velocity with historical time-of-day pace.
                  </p>
                </div>
              )}

              <div className="mx-auto mt-5 max-w-md border-y border-[#E6DED2] py-3 text-left">
                <div className="flex items-center gap-2 text-xs font-bold text-[#1F2933]">
                  <Radio className="h-3.5 w-3.5 text-[#2F7D6D]" />
                  Live Token Status: <span className="uppercase text-[#2F7D6D]">{token.status}</span>
                </div>
                <p className="mt-1 text-xs text-[#667085]">
                  This token updates in real time as shop staff call and complete customers ahead of you.
                </p>
              </div>

              <button
                onClick={async () => {
                  if (window.confirm('Are you sure you want to cancel your queue token?')) {
                    try {
                      await api.post(`/queue/cancel/${token._id}`);
                      refreshAll();
                    } catch (error) {
                      console.error('Cancel failed', error);
                    }
                  }
                }}
                className="btn-danger mt-5 h-9 text-xs"
              >
                Cancel Token
              </button>
            </div>
          </div>
        )}
      </section>

      {/* SECTION 2: SHOP VISIT HISTORY */}
      <section className="space-y-4">
        <div className="flex items-center justify-between border-b border-[#E6DED2] pb-3">
          <div className="flex items-center gap-2">
            <History className="h-5 w-5 text-[#2F7D6D]" />
            <h2 className="text-xl font-bold text-[#1F2933]">Shop Visit History</h2>
            <span className="rounded-full bg-[#F0EAE1] px-2 py-0.5 text-xs font-bold text-[#667085]">
              {history.length}
            </span>
          </div>
          <p className="text-xs text-[#667085] hidden sm:block">
            Shops where your token was called and completed
          </p>
        </div>

        {historyLoading ? (
          <div className="panel flex justify-center py-8">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#D5CCC0] border-t-[#2F7D6D]" />
          </div>
        ) : history.length === 0 ? (
          <div className="panel p-6 text-center bg-white border border-[#E6DED2]">
            <History className="mx-auto mb-2 h-8 w-8 text-[#9CA3AF]" />
            <h3 className="text-sm font-bold text-[#1F2933]">No Completed Shop Visits Yet</h3>
            <p className="mx-auto mt-1 max-w-sm text-xs text-[#667085]">
              When you join a shop queue and the shop staff calls and completes your token, the shop will automatically be recorded here in your history.
            </p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {history.map((visit) => {
              const completedDate = visit.completedAt ? new Date(visit.completedAt) : null;
              const formattedDate = completedDate
                ? completedDate.toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  })
                : 'Recent';
              const formattedTime = completedDate
                ? completedDate.toLocaleTimeString(undefined, {
                    hour: 'numeric',
                    minute: '2-digit'
                  })
                : '';

              return (
                <div
                  key={visit._id}
                  className="panel p-4 flex flex-col justify-between hover:border-[#2F7D6D] transition bg-white"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="status-badge status-warn text-[10px]">
                        {visit.category || 'Retail'}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-[#EBF2EE] px-2 py-0.5 text-[10px] font-bold text-[#2F7D6D]">
                        <CheckCircle className="h-3 w-3" />
                        Completed
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-[#1F2933]">{visit.businessName}</h3>
                    {visit.address && (
                      <p className="text-xs text-[#667085] flex items-center gap-1 mt-0.5">
                        <MapPin className="h-3 w-3 shrink-0" />
                        <span className="truncate">{visit.address}</span>
                      </p>
                    )}

                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs border-t border-[#E6DED2] pt-2.5">
                      <div>
                        <span className="label-caps block text-[9px]">Token</span>
                        <span className="metric-number font-bold text-sm text-[#1F2933]">
                          {visit.tokenLabel || visit.tokenNumber}
                        </span>
                      </div>
                      <div>
                        <span className="label-caps block text-[9px]">Counter</span>
                        <span className="font-semibold text-xs text-[#1F2933] truncate block">
                          {visit.counterName || 'Counter Desk'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-[#E6DED2] flex items-center justify-between text-[11px] text-[#667085]">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span>{formattedDate} {formattedTime && `at ${formattedTime}`}</span>
                    </div>
                    {visit.durationMinutes > 0 && (
                      <span className="font-medium text-[#2F7D6D]">
                        ~{visit.durationMinutes}m service
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};
