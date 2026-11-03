import React, { useState, useEffect, useMemo } from 'react';
import {
  Clock,
  Compass,
  MapPin,
  Search,
  Users,
  CheckCircle,
  X,
  Layers,
  ArrowUpDown,
  SlidersHorizontal,
  Zap,
  TrendingDown,
  Navigation,
  Scale
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/client';
import { io } from 'socket.io-client';

const CATEGORIES = [
  'All',
  'Healthcare',
  'Food & Beverage',
  'Banking',
  'Retail',
  'Services',
  'Fitness',
  'Restaurant'
];

export const DiscoverPage = () => {
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [distanceRadius, setDistanceRadius] = useState('all'); // 'all', '2', '5', '10'
  const [sortBy, setSortBy] = useState('default'); // 'default', 'wait_time', 'queue_size', 'distance', 'name'
  const [openOnly, setOpenOnly] = useState(false);

  // Selected businesses for comparison (up to 4)
  const [compareIds, setCompareIds] = useState([]);
  const [showComparisonModal, setShowComparisonModal] = useState(false);
  const [joiningId, setJoiningId] = useState(null);

  const navigate = useNavigate();

  const fetchBusinesses = async () => {
    try {
      const params = {};
      if (selectedCategory !== 'All') params.category = selectedCategory;
      if (distanceRadius !== 'all') params.maxDistance = distanceRadius;
      if (sortBy !== 'default') params.sort = sortBy;
      if (openOnly) params.status = 'open';
      if (searchQuery.trim()) params.search = searchQuery.trim();

      const response = await api.get('/businesses', { params });
      setBusinesses(response.data.data.businesses || []);
    } catch (error) {
      console.error('Failed to fetch businesses:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBusinesses();
  }, [selectedCategory, distanceRadius, sortBy, openOnly]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchBusinesses();
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Real-time synchronization
  useEffect(() => {
    const socketUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    const socket = io(socketUrl);
    socket.on('public:queue:updated', fetchBusinesses);
    socket.on('queue:updated', fetchBusinesses);
    return () => socket.disconnect();
  }, []);

  const handleJoinQueue = async (businessId) => {
    try {
      setJoiningId(businessId);
      await api.post('/queue/join', { businessId });
      navigate('/my-queue');
    } catch (error) {
      console.error('Failed to join queue:', error);
      alert(error.response?.data?.message || 'Could not join queue. Please check if you already have an active token.');
    } finally {
      setJoiningId(null);
    }
  };

  const toggleCompare = (id) => {
    setCompareIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((item) => item !== id);
      }
      if (prev.length >= 4) {
        alert('You can compare up to 4 locations at a time.');
        return prev;
      }
      return [...prev, id];
    });
  };

  // Compare all visible in current category
  const handleCompareCategory = () => {
    const ids = businesses.slice(0, 4).map((b) => b._id);
    if (ids.length < 2) {
      alert('Need at least 2 locations to compare.');
      return;
    }
    setCompareIds(ids);
    setShowComparisonModal(true);
  };

  // Filtered & Compared items data
  const comparedBusinesses = useMemo(() => {
    const list = businesses.filter((b) => compareIds.includes(b._id));

    if (list.length === 0) return [];

    let minWait = Infinity;
    let minQueue = Infinity;
    let minDistance = Infinity;

    list.forEach((b) => {
      const wait = b.stats?.estimatedWaitMins ?? b.estimatedWaitMins ?? 0;
      const queue = b.stats?.totalWaiting ?? b.queueSize ?? 0;
      const dist = parseFloat(b.distanceMiles || 0);

      if (b.isOpen) {
        if (wait < minWait) minWait = wait;
        if (queue < minQueue) minQueue = queue;
      }
      if (!isNaN(dist) && dist < minDistance) minDistance = dist;
    });

    return list.map((b) => {
      const wait = b.stats?.estimatedWaitMins ?? b.estimatedWaitMins ?? 0;
      const queue = b.stats?.totalWaiting ?? b.queueSize ?? 0;
      const dist = parseFloat(b.distanceMiles || 0);

      return {
        ...b,
        waitVal: wait,
        queueVal: queue,
        distVal: dist,
        isFastestWait: b.isOpen && wait === minWait,
        isShortestQueue: b.isOpen && queue === minQueue,
        isClosest: dist === minDistance
      };
    });
  }, [businesses, compareIds]);

  return (
    <div className="page-wrap space-y-6 pb-24">
      {/* Header */}
      <div className="section-rule pb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <p className="label-caps">Customer Discovery & Comparison</p>
            <h1 className="mt-2 flex items-center gap-2 text-3xl font-bold text-[#1F2933]">
              <Compass className="h-7 w-7 text-[#2F7D6D]" />
              Nearby Queue Comparison
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#667085]">
              Compare nearby locations side-by-side based on queue size, estimated wait time, distance, and availability before joining remotely.
            </p>
          </div>

          {businesses.length >= 2 && (
            <button
              onClick={handleCompareCategory}
              className="btn-secondary self-start md:self-auto inline-flex items-center gap-2 text-xs font-bold"
            >
              <Scale className="h-4 w-4 text-[#2F7D6D]" />
              Quick Compare Top {Math.min(4, businesses.length)}
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="panel p-4 space-y-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="input-icon" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search clinics, banks, cafes, service desks..."
              className="input-field pl-10"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Distance Radius */}
            <div className="flex items-center gap-1.5 bg-[#FAF7F0] border border-[#E6DED2] rounded-md px-2.5 py-1.5 text-xs">
              <MapPin className="h-3.5 w-3.5 text-[#2F7D6D]" />
              <select
                value={distanceRadius}
                onChange={(e) => setDistanceRadius(e.target.value)}
                className="bg-transparent font-medium text-[#1F2933] focus:outline-none"
              >
                <option value="all">Any distance</option>
                <option value="2">Within 2 miles</option>
                <option value="5">Within 5 miles</option>
                <option value="10">Within 10 miles</option>
              </select>
            </div>

            {/* Sort Options */}
            <div className="flex items-center gap-1.5 bg-[#FAF7F0] border border-[#E6DED2] rounded-md px-2.5 py-1.5 text-xs">
              <ArrowUpDown className="h-3.5 w-3.5 text-[#2F7D6D]" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-transparent font-medium text-[#1F2933] focus:outline-none"
              >
                <option value="default">Sort: Default</option>
                <option value="wait_time">Sort: Fastest Wait Time</option>
                <option value="queue_size">Sort: Shortest Queue</option>
                <option value="distance">Sort: Closest Distance</option>
                <option value="name">Sort: Venue Name</option>
              </select>
            </div>

            {/* Open Only Toggle */}
            <label className="flex items-center gap-2 bg-[#FAF7F0] border border-[#E6DED2] rounded-md px-3 py-1.5 text-xs font-semibold cursor-pointer text-[#1F2933] hover:bg-[#F0EAE1] transition">
              <input
                type="checkbox"
                checked={openOnly}
                onChange={(e) => setOpenOnly(e.target.checked)}
                className="rounded text-[#2F7D6D] focus:ring-[#2F7D6D]"
              />
              <span>Open Queues Only</span>
            </label>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 text-xs">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`rounded-full px-3.5 py-1.5 font-medium transition whitespace-nowrap ${
                selectedCategory === cat
                  ? 'bg-[#1F2933] text-white shadow-sm'
                  : 'bg-[#FAF7F0] text-[#667085] hover:bg-[#F0EAE1] hover:text-[#1F2933] border border-[#E6DED2]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Venues Grid */}
      {loading ? (
        <div className="panel p-12 text-center text-sm text-[#667085] flex flex-col items-center justify-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#D5CCC0] border-t-[#2F7D6D]" />
          <span>Scanning nearby virtual queues...</span>
        </div>
      ) : businesses.length === 0 ? (
        <div className="panel p-12 text-center text-sm text-[#667085]">
          <Compass className="mx-auto mb-3 h-10 w-10 text-[#D5CCC0]" />
          <h3 className="text-base font-bold text-[#1F2933]">No locations found</h3>
          <p className="mt-1">Try expanding your distance filter or choosing another category.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {businesses.map((biz) => {
            const waiting = biz.stats ? biz.stats.totalWaiting : (biz.queueSize || 0);
            const wait = biz.stats ? biz.stats.estimatedWaitMins : (biz.estimatedWaitMins || 0);
            const activeCounters = biz.activeCounters ?? (biz.counters?.filter((c) => c.isActive).length || 1);
            const totalCounters = biz.totalCounters ?? (biz.counters?.length || 1);
            const canJoin = biz.isActive && biz.isOpen !== false && biz.allowRemoteJoin !== false;
            const isSelected = compareIds.includes(biz._id);

            return (
              <article
                key={biz._id}
                className={`panel relative flex flex-col justify-between p-5 transition-all duration-200 hover:border-[#D5CCC0] hover:shadow-md ${
                  isSelected ? 'ring-2 ring-[#2F7D6D] border-[#2F7D6D] bg-[#FCFDFD]' : 'bg-white'
                }`}
              >
                <div>
                  {/* Card Header & Checkbox */}
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="status-badge status-warn">{biz.category || 'General'}</span>
                      <span className={biz.isOpen !== false && biz.isActive ? 'status-badge status-open' : 'status-badge status-danger'}>
                        <span className={`beacon ${biz.isOpen !== false && biz.isActive ? 'bg-[#2F7D6D]' : 'bg-[#B44A3F]'}`} />
                        {biz.isOpen !== false && biz.isActive ? 'Queue Open' : 'Queue Paused'}
                      </span>
                    </div>

                    {/* Compare Selection Checkbox */}
                    <button
                      onClick={() => toggleCompare(biz._id)}
                      className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-bold transition border ${
                        isSelected
                          ? 'border-[#2F7D6D] bg-[#EBF2EE] text-[#2F7D6D]'
                          : 'border-[#E6DED2] bg-[#FAF7F0] text-[#667085] hover:text-[#1F2933]'
                      }`}
                      title="Select for side-by-side comparison"
                    >
                      <Scale className="h-3.5 w-3.5" />
                      <span>{isSelected ? 'Comparing' : 'Compare'}</span>
                    </button>
                  </div>

                  <h2 className="text-xl font-bold text-[#1F2933]">{biz.name}</h2>
                  <div className="mt-2 flex flex-col gap-1 text-sm text-[#667085] sm:flex-row sm:items-center sm:justify-between">
                    <span className="flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 shrink-0" />
                      <span className="line-clamp-1">{biz.address}</span>
                    </span>
                    <span className="font-semibold text-[#2F7D6D] shrink-0">{biz.distanceMiles} mi</span>
                  </div>

                  {/* Core Metrics Comparison Cards */}
                  <div className="my-4 grid grid-cols-3 gap-2.5">
                    <div className="panel-muted p-2.5 text-center">
                      <p className="label-caps text-[10px]">Queue Size</p>
                      <div className="mt-1 flex items-center justify-center gap-1">
                        <Users className="h-3.5 w-3.5 text-[#2F7D6D]" />
                        <span className="metric-number text-xl font-bold">{waiting}</span>
                      </div>
                      <span className="text-[11px] text-[#667085]">waiting</span>
                    </div>

                    <div className="panel-muted p-2.5 text-center">
                      <p className="label-caps text-[10px]">Est. Wait</p>
                      <div className="mt-1 flex items-center justify-center gap-1">
                        <Clock className="h-3.5 w-3.5 text-[#C98A2E]" />
                        <span className="metric-number text-xl font-bold">{wait}</span>
                        <span className="text-xs font-semibold">m</span>
                      </div>
                      <span className="text-[11px] text-[#667085]">dynamic ETA</span>
                    </div>

                    <div className="panel-muted p-2.5 text-center">
                      <p className="label-caps text-[10px]">Availability</p>
                      <div className="mt-1 flex items-center justify-center gap-1">
                        <Layers className="h-3.5 w-3.5 text-[#2F7D6D]" />
                        <span className="metric-number text-base font-bold text-[#1F2933]">
                          {activeCounters}/{totalCounters}
                        </span>
                      </div>
                      <span className="text-[11px] text-[#667085]">counters active</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <button
                    onClick={() => handleJoinQueue(biz._id)}
                    disabled={!canJoin || joiningId === biz._id}
                    className="btn-primary w-full text-sm font-bold flex items-center justify-center gap-2"
                  >
                    {joiningId === biz._id ? (
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    ) : canJoin ? (
                      'Join Virtual Queue'
                    ) : (
                      'Queue Unavailable'
                    )}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Floating Comparison Dock */}
      {compareIds.length > 0 && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-40 w-[95%] max-w-2xl rounded-2xl border border-[#2F7D6D] bg-[#1F2933] text-white p-4 shadow-2xl animate-in slide-in-from-bottom-5 duration-200">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#2F7D6D] text-white font-bold">
                <Scale className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-bold">
                  {compareIds.length} {compareIds.length === 1 ? 'Location' : 'Locations'} Selected
                </p>
                <p className="text-xs text-[#A0AEC0]">Compare queue size, waiting time, and counter availability.</p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={() => setCompareIds([])}
                className="btn-secondary h-9 px-3 text-xs bg-transparent border-[#4A5568] text-[#E2E8F0] hover:bg-[#2D3748]"
              >
                Clear
              </button>
              <button
                onClick={() => setShowComparisonModal(true)}
                className="btn-primary h-9 px-4 text-xs font-bold bg-[#2F7D6D] hover:bg-[#27675A] border-none text-white w-full sm:w-auto"
              >
                Compare Side-by-Side
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Comparison Modal / Matrix */}
      {showComparisonModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative max-h-[90vh] w-full max-w-5xl rounded-2xl border border-[#E6DED2] bg-[#FFFDF9] shadow-2xl overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[#E6DED2] bg-[#FAF7F0] px-6 py-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#2F7D6D] text-white">
                  <Scale className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[#1F2933]">Nearby Queue Comparison Matrix</h3>
                  <p className="text-xs text-[#667085]">Side-by-side analysis of queue depth, wait times, and availability</p>
                </div>
              </div>
              <button
                onClick={() => setShowComparisonModal(false)}
                className="rounded-lg p-1.5 text-[#667085] hover:bg-[#E6DED2] hover:text-[#1F2933] transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Matrix Table */}
            <div className="flex-1 overflow-x-auto p-6">
              {comparedBusinesses.length === 0 ? (
                <div className="py-12 text-center text-sm text-[#667085]">
                  Select at least 2 locations to view the comparison matrix.
                </div>
              ) : (
                <div className="grid grid-cols-[180px_repeat(auto-fit,minmax(200px,1fr))] gap-4 min-w-[700px]">
                  {/* Left Parameter Labels Column */}
                  <div className="space-y-6 pt-2 font-semibold text-xs text-[#667085]">
                    <div className="h-16 flex items-end pb-2 font-bold text-sm text-[#1F2933]">Venue</div>
                    <div className="h-10 flex items-center">Availability Status</div>
                    <div className="h-12 flex items-center">Queue Size</div>
                    <div className="h-12 flex items-center">Estimated Wait</div>
                    <div className="h-10 flex items-center">Service Pace</div>
                    <div className="h-10 flex items-center">Active Counters</div>
                    <div className="h-10 flex items-center">Distance</div>
                    <div className="h-10 flex items-center">Action</div>
                  </div>

                  {/* Compared Business Columns */}
                  {comparedBusinesses.map((biz) => {
                    const activeCounters = biz.activeCounters ?? (biz.counters?.filter((c) => c.isActive).length || 1);
                    const totalCounters = biz.totalCounters ?? (biz.counters?.length || 1);
                    const canJoin = biz.isActive && biz.isOpen !== false && biz.allowRemoteJoin !== false;

                    return (
                      <div
                        key={biz._id}
                        className={`rounded-xl border p-4 flex flex-col justify-between space-y-6 transition ${
                          biz.isFastestWait
                            ? 'border-[#2F7D6D] bg-[#F7FAF8] shadow-sm'
                            : 'border-[#E6DED2] bg-white'
                        }`}
                      >
                        {/* Venue Info */}
                        <div className="h-16 flex flex-col justify-between">
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-[#C98A2E]">
                              {biz.category}
                            </span>
                            <h4 className="font-bold text-base text-[#1F2933] line-clamp-1">{biz.name}</h4>
                          </div>
                          <span className="text-[11px] text-[#667085] line-clamp-1">{biz.address}</span>
                        </div>

                        {/* Availability Status */}
                        <div className="h-10 flex items-center">
                          <span
                            className={
                              biz.isOpen !== false && biz.isActive
                                ? 'status-badge status-open'
                                : 'status-badge status-danger'
                            }
                          >
                            <span
                              className={`beacon ${biz.isOpen !== false && biz.isActive ? 'bg-[#2F7D6D]' : 'bg-[#B44A3F]'}`}
                            />
                            {biz.isOpen !== false && biz.isActive ? 'Open & Ready' : 'Paused'}
                          </span>
                        </div>

                        {/* Queue Size */}
                        <div className="h-12 flex items-center justify-between">
                          <div>
                            <span className="metric-number text-2xl font-bold text-[#1F2933]">{biz.queueVal}</span>
                            <span className="text-xs text-[#667085] ml-1">in line</span>
                          </div>
                          {biz.isShortestQueue && (
                            <span className="rounded-md bg-[#EBF2EE] border border-[#B9D4C8] px-2 py-0.5 text-[10px] font-bold text-[#2F7D6D]">
                              Shortest Line
                            </span>
                          )}
                        </div>

                        {/* Estimated Wait */}
                        <div className="h-12 flex items-center justify-between">
                          <div>
                            <span className="metric-number text-2xl font-bold text-[#C98A2E]">~{biz.waitVal}</span>
                            <span className="text-xs text-[#667085] ml-1">min</span>
                          </div>
                          {biz.isFastestWait && (
                            <span className="rounded-md bg-[#EBF2EE] border border-[#B9D4C8] px-2 py-0.5 text-[10px] font-bold text-[#2F7D6D] flex items-center gap-1">
                              <Zap className="h-3 w-3" />
                              Fastest
                            </span>
                          )}
                        </div>

                        {/* Service Pace */}
                        <div className="h-10 flex items-center">
                          <span className="metric-number text-sm font-semibold text-[#1F2933]">
                            ~{biz.stats?.prediction?.blendedAvgServiceTime ?? biz.settings?.avgServiceTimeDefault ?? 5}m / token
                          </span>
                        </div>

                        {/* Active Counters */}
                        <div className="h-10 flex items-center">
                          <span className="metric-number text-sm font-semibold text-[#1F2933]">
                            {activeCounters} of {totalCounters} active
                          </span>
                        </div>

                        {/* Distance */}
                        <div className="h-10 flex items-center justify-between">
                          <span className="metric-number text-sm font-bold text-[#2F7D6D]">{biz.distanceMiles} mi</span>
                          {biz.isClosest && (
                            <span className="rounded-md bg-[#FAF7F0] border border-[#E6DED2] px-2 py-0.5 text-[10px] font-bold text-[#1F2933]">
                              Closest
                            </span>
                          )}
                        </div>

                        {/* Join Queue Button */}
                        <div className="h-10 flex items-center">
                          <button
                            onClick={() => {
                              setShowComparisonModal(false);
                              handleJoinQueue(biz._id);
                            }}
                            disabled={!canJoin || joiningId === biz._id}
                            className={`w-full py-2 px-3 rounded-lg text-xs font-bold transition ${
                              biz.isFastestWait
                                ? 'bg-[#2F7D6D] hover:bg-[#27675A] text-white shadow-sm'
                                : 'btn-primary'
                            }`}
                          >
                            {canJoin ? 'Join Virtual Queue' : 'Unavailable'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="border-t border-[#E6DED2] bg-[#FAF7F0] px-6 py-3 flex items-center justify-between text-xs text-[#667085]">
              <span>Real-time metrics synchronized with live service counters</span>
              <button
                onClick={() => setShowComparisonModal(false)}
                className="btn-secondary h-8 px-3 text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
