import React from 'react';
import { Clock, AlertCircle, ArrowLeft, Radio } from 'lucide-react';
import { Link } from 'react-router-dom';

export const MyQueuePage = () => {
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

        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 mb-8 max-w-sm mx-auto text-left text-xs space-y-2 text-slate-400">
          <div className="flex items-center gap-2 text-slate-300 font-semibold">
            <Radio className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
            <span>Hero Screen (Phase 2 & 3 Spec)</span>
          </div>
          <p>• Large digital token number (e.g. A-042)</p>
          <p>• Live position countdown & people ahead</p>
          <p>• Dynamic ETA wait-time estimation</p>
          <p>• Sound & push alert when called</p>
        </div>

        <Link
          to="/discover"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 transition-all"
        >
          <span>Discover Nearby Queues</span>
        </Link>
      </div>
    </div>
  );
};
