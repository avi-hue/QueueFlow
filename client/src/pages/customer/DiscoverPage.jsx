import React, { useState, useEffect } from 'react';
import { Clock, Compass, MapPin, Search, Users } from 'lucide-react';
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
    const socket = io();
    socket.on('public:queue:updated', fetchBusinesses);
    return () => socket.disconnect();
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
    <div className="page-wrap space-y-6">
      <div className="section-rule pb-6">
        <p className="label-caps">Customer Discovery</p>
        <h1 className="mt-2 flex items-center gap-2 text-3xl font-bold text-[#1F2933]">
          <Compass className="h-7 w-7 text-[#2F7D6D]" />
          Discover Nearby Queues
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[#667085]">Compare queue length, distance, and wait estimates before joining remotely.</p>
      </div>

      <div className="panel-muted flex flex-col gap-3 p-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="input-icon" />
          <input type="text" placeholder="Search clinics, banks, cafes, service desks..." className="input-field pl-10" />
        </div>
        <button className="btn-secondary">
          <MapPin className="h-4 w-4 text-[#2F7D6D]" />
          Within 5 miles
        </button>
      </div>

      {loading ? (
        <div className="panel p-8 text-center text-sm text-[#667085]">Loading businesses...</div>
      ) : businesses.length === 0 ? (
        <div className="panel p-8 text-center text-sm text-[#667085]">No businesses found.</div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {businesses.map((biz) => {
            const waiting = biz.stats ? biz.stats.totalWaiting : 0;
            const wait = biz.stats ? biz.stats.estimatedWaitMins : 0;
            const canJoin = biz.isActive && biz.settings?.allowRemoteJoin !== false;

            return (
              <article key={biz._id} className="panel flex flex-col justify-between p-5 transition hover:border-[#D5CCC0] hover:bg-white">
                <div>
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <span className="status-badge status-warn">{biz.category || 'General'}</span>
                    <span className={biz.isActive ? 'status-badge status-open' : 'status-badge status-danger'}>
                      <span className={`beacon ${biz.isActive ? 'bg-[#2F7D6D]' : 'bg-[#B44A3F]'}`} />
                      {biz.isActive ? 'Open' : 'Closed'}
                    </span>
                  </div>

                  <h2 className="text-xl font-bold text-[#1F2933]">{biz.name}</h2>
                  <div className="mt-2 flex flex-col gap-1 text-sm text-[#667085] sm:flex-row sm:items-center sm:justify-between">
                    <span className="flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 shrink-0" />
                      <span className="line-clamp-1">{biz.address}</span>
                    </span>
                    <span className="font-semibold text-[#2F7D6D]">{biz.distanceMiles} mi</span>
                  </div>

                  <div className="my-5 grid grid-cols-2 gap-3">
                    <div className="panel-muted p-3">
                      <p className="label-caps">Live Queue</p>
                      <div className="mt-2 flex items-center gap-2">
                        <Users className="h-4 w-4 text-[#2F7D6D]" />
                        <span className="metric-number text-2xl font-bold">{waiting}</span>
                        <span className="text-xs text-[#667085]">waiting</span>
                      </div>
                    </div>
                    <div className="panel-muted p-3">
                      <p className="label-caps">Est. Wait</p>
                      <div className="mt-2 flex items-center gap-2">
                        <Clock className="h-4 w-4 text-[#C98A2E]" />
                        <span className="metric-number text-2xl font-bold">{wait}</span>
                        <span className="text-xs text-[#667085]">min</span>
                      </div>
                    </div>
                  </div>
                </div>

                <button onClick={() => handleJoinQueue(biz._id)} disabled={!canJoin} className="btn-primary w-full">
                  {canJoin ? 'Join Virtual Queue' : 'Remote Join Unavailable'}
                </button>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};
