import React, { useEffect, useState } from 'react';
import { Clock, Radio, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { io } from 'socket.io-client';
import api from '../../api/client';

export const MyQueuePage = () => {
  const [tokenData, setTokenData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchToken = async () => {
    try {
      const response = await api.get('/queue/my-token');
      setTokenData(response.data.data);
    } catch (error) {
      if (error.response?.status === 404) setTokenData(null);
      else console.error('Failed to fetch token:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchToken();
    const authToken = localStorage.getItem('token') || localStorage.getItem('queueflow_token');
    if (!authToken) return;

    const socketUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    const socket = io(socketUrl, { auth: { token: authToken } });
    socket.on('token:updated', fetchToken);
    socket.on('queue:updated', fetchToken);
    return () => socket.disconnect();
  }, []);

  if (loading) {
    return (
      <div className="mx-auto flex max-w-2xl justify-center px-4 py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#D5CCC0] border-t-[#2F7D6D]" />
      </div>
    );
  }

  if (!tokenData || !tokenData.token) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12">
        <div className="panel-focus p-8 text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-lg border border-[#E6DED2] bg-[#F0EAE1] text-[#2F7D6D]">
            <Clock className="h-8 w-8" />
          </div>
          <p className="label-caps">Token Desk</p>
          <h1 className="mt-2 text-2xl font-bold text-[#1F2933]">No Active Token</h1>
          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[#667085]">
            Join a live queue from discovery to track your token, position, and estimated wait time.
          </p>
          <Link to="/discover" className="btn-primary mt-6 h-11 px-5">
            Discover Nearby Queues
          </Link>
        </div>
      </div>
    );
  }

  const token = tokenData.token;
  const position = token.position;
  const estimatedWaitMins = token.estimatedWaitMins;
  const tokenLabel = token.tokenLabel || token.tokenNumber;
  const isCalled = token.status === 'called';

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <div className={`panel-focus overflow-hidden ${isCalled ? 'border-2 border-[#2F7D6D]' : ''}`}>
        <div className="border-b border-[#E6DED2] bg-[#F0EAE1] px-6 py-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="label-caps">Digital Queue Token</p>
              <h1 className="mt-1 text-xl font-bold text-[#1F2933]">{token.businessName || 'Unknown Venue'}</h1>
            </div>
            <span className={isCalled ? 'status-badge status-open' : 'status-badge status-warn'}>
              <span className={`beacon ${isCalled ? 'bg-[#2F7D6D]' : 'bg-[#C98A2E]'}`} />
              {token.status}
            </span>
          </div>
        </div>

        <div className="p-6 text-center sm:p-8">
          <div className="mx-auto flex min-h-28 max-w-xs items-center justify-center rounded-lg border border-[#E6DED2] bg-white px-6 py-5">
            <span className="metric-number text-5xl font-bold tracking-[0.04em] text-[#1F2933]">{tokenLabel}</span>
          </div>

          {isCalled && (
            <p className="mx-auto mt-5 max-w-md rounded-md border border-[#B9D4C8] bg-[#EBF2EE] px-4 py-3 text-sm font-bold text-[#2F7D6D]">
              Please proceed to {token.counterId?.name || 'your assigned counter'}.
            </p>
          )}

          <div className="mx-auto mt-6 grid max-w-md grid-cols-2 gap-3">
            <div className="panel-muted p-4">
              <Users className="mx-auto mb-2 h-5 w-5 text-[#2F7D6D]" />
              <p className="label-caps">Position</p>
              <p className="metric-number mt-1 text-3xl font-bold">{position}</p>
            </div>
            <div className="panel-muted p-4">
              <Clock className="mx-auto mb-2 h-5 w-5 text-[#C98A2E]" />
              <p className="label-caps">Est. Wait</p>
              <p className="metric-number mt-1 text-3xl font-bold">{estimatedWaitMins}m</p>
            </div>
          </div>

          <div className="mx-auto mt-6 max-w-md border-y border-[#E6DED2] py-4 text-left">
            <div className="flex items-center gap-2 text-sm font-bold text-[#1F2933]">
              <Radio className="h-4 w-4 text-[#2F7D6D]" />
              Live status: {token.status}
            </div>
            <p className="mt-1 text-sm text-[#667085]">This card updates through the live queue connection when staff call or complete tokens.</p>
          </div>

          <button
            onClick={async () => {
              if (window.confirm('Are you sure you want to cancel your token?')) {
                try {
                  await api.post(`/queue/cancel/${token._id}`);
                  fetchToken();
                } catch (error) {
                  console.error('Cancel failed', error);
                }
              }
            }}
            className="btn-danger mt-6"
          >
            Cancel Token
          </button>
        </div>
      </div>
    </div>
  );
};
