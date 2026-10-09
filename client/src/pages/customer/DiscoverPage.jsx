import React, { useState, useEffect } from 'react';
import { Compass, Search, MapPin, Clock, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/client';
import { io } from 'socket.io-client';

export const DiscoverPage = () => {
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchBusinesses = async () => {
    try {
      const response = await api.get('/businesses');
      setBusinesses(response.data.data.businesses || []);
    } catch (error) {
      console.error('Failed to fetch businesses:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBusinesses();

    // Keep businesses in sync in real-time
    const socket = io();
    socket.on('public:queue:updated', () => {
      fetchBusinesses(); // Refresh list to get latest wait times & sizes
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const handleJoinQueue = async (businessId) => {
    try {
      await api.post('/queue/join', { businessId });
      navigate('/my-queue');
    } catch (error) {
      console.error('Failed to join queue:', error);
      alert('Could not join queue. Please try again.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="pb-6 border-b border-slate-800">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-2.5">
          <Compass className="w-7 h-7 text-indigo-400" />
          <span>Discover Nearby Queues</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Explore live queues in your area, compare estimated wait times, and join virtually.
        </p>
      </div>

      {/* Search & Filter Mockup Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search clinics, banks, cafes, DMV..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500"
          />
        </div>
        <button className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 rounded-xl text-sm font-semibold flex items-center justify-center gap-2">
          <MapPin className="w-4 h-4 text-indigo-400" />
          <span>Within 5 miles</span>
        </button>
      </div>

      {/* Discovery List */}
      {loading ? (
        <div className="text-center text-slate-400 py-8">Loading businesses...</div>
      ) : businesses.length === 0 ? (
        <div className="text-center text-slate-400 py-8">No businesses found.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {businesses.map((biz) => (
            <div
              key={biz._id}
              className="glass-card glass-card-hover rounded-2xl p-6 border border-slate-800 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    {biz.category || 'General'}
                  </span>
                  <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    {biz.isActive ? 'Open' : 'Closed'}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-white">{biz.name}</h3>
                <p className="text-xs text-slate-400 mt-1 flex items-center justify-between gap-1">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span>{biz.address}</span>
                  </span>
                  <span className="text-indigo-400 font-semibold">{biz.distanceMiles} mi away</span>
                </p>

                {/* Stats Box */}
                <div className="grid grid-cols-2 gap-3 my-4 p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                  <div>
                    <span className="text-[11px] text-slate-400 uppercase font-semibold">Live Queue</span>
                    <div className="text-xl font-extrabold text-white flex items-center gap-1 mt-0.5">
                      <Users className="w-4 h-4 text-indigo-400" />
                      <span>{biz.stats ? biz.stats.totalWaiting : 0} waiting</span>
                    </div>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 uppercase font-semibold">Est. Wait</span>
                    <div className="text-xl font-extrabold text-white flex items-center gap-1 mt-0.5">
                      <Clock className="w-4 h-4 text-purple-400" />
                      <span>~{biz.stats ? biz.stats.estimatedWaitMins : 0} min</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => handleJoinQueue(biz._id)}
                  disabled={!biz.isActive || biz.settings?.allowRemoteJoin === false}
                  className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  <span>Join Virtual Queue</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

