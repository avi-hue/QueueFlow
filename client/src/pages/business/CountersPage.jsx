import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/client';
import { Layers, Plus, Trash2, Power, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export const CountersPage = () => {
  const { business, refreshBusiness, isOwner } = useAuth();
  const [newCounterName, setNewCounterName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleAddCounter = async (e) => {
    e.preventDefault();
    if (!newCounterName.trim()) return;

    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await api.post('/business/counters', {
        name: newCounterName.trim(),
        isActive: true
      });
      setNewCounterName('');
      setSuccess('Counter added successfully!');
      await refreshBusiness();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add counter');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleCounter = async (counterId, currentStatus) => {
    try {
      await api.patch(`/business/counters/${counterId}`, {
        isActive: !currentStatus
      });
      await refreshBusiness();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update counter');
    }
  };

  const handleDeleteCounter = async (counterId) => {
    if (!window.confirm('Are you sure you want to delete this counter?')) return;

    try {
      await api.delete(`/business/counters/${counterId}`);
      await refreshBusiness();
      setSuccess('Counter deleted');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete counter');
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-6 border-b border-slate-800">
        <div>
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white mb-2 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Dashboard</span>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-2.5">
            <Layers className="w-7 h-7 text-indigo-400" />
            <span>Service Counters</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Configure service desks, stations, or registers where customers are called and served.
          </p>
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-sm flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Add New Counter Form (Owner only) */}
      {isOwner && (
        <div className="glass-card rounded-2xl p-6 border border-slate-800">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">
            Add New Counter
          </h3>
          <form onSubmit={handleAddCounter} className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              required
              value={newCounterName}
              onChange={(e) => setNewCounterName(e.target.value)}
              placeholder="e.g. Counter 2, Consultation Room 3, Pickup Window..."
              className="flex-1 px-4 py-2.5 bg-slate-900/90 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-sm"
            />
            <button
              type="submit"
              disabled={loading || !newCounterName.trim()}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              <span>Add Counter</span>
            </button>
          </form>
        </div>
      )}

      {/* Existing Counters List */}
      <div className="glass-card rounded-2xl p-6 border border-slate-800 space-y-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-2">
          Current Counters ({business?.counters?.length || 0})
        </h3>

        {business?.counters && business.counters.length > 0 ? (
          <div className="divide-y divide-slate-800">
            {business.counters.map((counter) => (
              <div
                key={counter._id}
                className="py-4 first:pt-0 last:pb-0 flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      counter.isActive ? 'bg-emerald-400' : 'bg-slate-600'
                    }`}
                  />
                  <div>
                    <h4 className="font-bold text-white text-base">{counter.name}</h4>
                    <p className="text-xs text-slate-400">
                      Status: {counter.isActive ? 'Active (Open for queues)' : 'Offline (Paused)'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {isOwner && (
                    <>
                      <button
                        onClick={() => handleToggleCounter(counter._id, counter.isActive)}
                        title={counter.isActive ? 'Deactivate Counter' : 'Activate Counter'}
                        className={`p-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                          counter.isActive
                            ? 'bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 border border-amber-500/30'
                            : 'bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 border border-emerald-500/30'
                        }`}
                      >
                        <Power className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">
                          {counter.isActive ? 'Pause' : 'Activate'}
                        </span>
                      </button>

                      <button
                        onClick={() => handleDeleteCounter(counter._id)}
                        title="Delete Counter"
                        className="p-2 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-500/10 border border-slate-800 hover:border-red-500/20 transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-slate-400 text-sm">No counters configured for this business yet.</p>
          </div>
        )}
      </div>
    </div>
  );
};
