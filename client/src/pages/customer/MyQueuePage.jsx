import React, { useEffect, useState } from 'react';
import { Clock, AlertCircle, ArrowLeft, Radio, Users } from 'lucide-react';
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
      if (error.response?.status === 404) {
        setTokenData(null);
      } else {
        console.error('Failed to fetch token:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchToken();

    const authToken = localStorage.getItem('token');
    if (!authToken) return;

    // We assume backend is on the same host or we connect to standard port, 
    // or use import.meta.env.VITE_API_URL if needed.
    // Given api/client points to some endpoint, we'll try to extract the base URL.
    const socketUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    const socket = io(socketUrl, {
      auth: {
        token: authToken
      }
    });

    socket.on('connect', () => {
      console.log('Socket connected:', socket.id);
    });

    socket.on('token:updated', (data) => {
      // Re-fetch or update state
      fetchToken();
    });

    socket.on('queue:updated', (data) => {
      // Re-fetch or update state
      fetchToken();
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 flex justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (!tokenData || !tokenData.token) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="glass-card rounded-3xl p-8 border border-slate-800 text-center relative overflow-hidden shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto mb-5">
            <Clock className="w-8 h-8" />
          </div>

          <h1 className="text-2xl font-extrabold text-white mb-2">No Active Token</h1>
          <p className="text-sm text-slate-400 max-w-md mx-auto mb-6">
            You are currently not queued at any venue. Join a live queue from the discovery page to track your digital token, real-time position, and wait estimation.
          </p>

          <Link
            to="/discover"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 transition-all"
          >
            <span>Discover Nearby Queues</span>
          </Link>
        </div>
      </div>
    );
  }

  const token = tokenData.token;
  const position = token.position;
  const estimatedWaitMins = token.estimatedWaitMins;

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <div className="glass-card rounded-3xl p-8 border border-slate-800 text-center relative overflow-hidden shadow-2xl">
        <div className="w-20 h-20 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto mb-5">
          <span className="text-3xl font-black">{token.tokenLabel || token.tokenNumber}</span>
        </div>

        <h1 className="text-2xl font-extrabold text-white mb-2">Your Token Status</h1>
        <p className="text-sm text-slate-400 max-w-md mx-auto mb-6">
          Venue: {token.businessName || 'Unknown Venue'}
        </p>

        <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto mb-8">
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col items-center">
            <Users className="w-5 h-5 text-indigo-400 mb-2" />
            <span className="text-xs text-slate-400 uppercase font-semibold">Position</span>
            <span className="text-2xl font-bold text-white mt-1">{position}</span>
          </div>
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col items-center">
            <Clock className="w-5 h-5 text-purple-400 mb-2" />
            <span className="text-xs text-slate-400 uppercase font-semibold">Wait Time</span>
            <span className="text-2xl font-bold text-white mt-1">~{estimatedWaitMins}m</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 mb-8 max-w-sm mx-auto text-left text-sm space-y-2 text-slate-400">
          <div className="flex items-center gap-2 text-slate-300 font-semibold">
            <Radio className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
            <span>Status: {token.status}</span>
          </div>
          {token.status === 'called' && (
            <p className="text-emerald-400 font-bold mt-2">Please proceed to counter {token.counterId?.name || 'Assigned Counter'}!</p>
          )}
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
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-red-600/20 hover:bg-red-600/40 text-red-400 font-bold text-sm transition-all"
        >
          Cancel Token
        </button>
      </div>
    </div>
  );
};
